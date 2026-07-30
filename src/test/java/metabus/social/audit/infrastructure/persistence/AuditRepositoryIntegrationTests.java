package metabus.social.audit.infrastructure.persistence;

import static metabus.social.PersistenceTestData.insertActiveAccount;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import metabus.social.PostgresIntegrationTestSupport;
import metabus.social.audit.domain.AuditOutcome;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

class AuditRepositoryIntegrationTests extends PostgresIntegrationTestSupport {

  private static final Instant NOW = Instant.parse("2026-07-30T00:00:00Z");

  @Autowired private AuditRecordRepository auditRecords;
  @Autowired private PlatformTransactionManager transactionManager;

  @Test
  void storesPurposeBoundedAuditFields() {
    UUID correlationId = UUID.randomUUID();
    UUID idempotencyKey = UUID.randomUUID();

    auditRecords.insert(auditRecord(UUID.randomUUID(), correlationId, idempotencyKey));

    AuditRecordEntity stored =
        auditRecords
            .findByCorrelationIdAndIdempotencyKey(correlationId, idempotencyKey)
            .orElseThrow();
    assertThat(stored.getAction()).isEqualTo("PERSISTENCE_TEST");
    assertThat(stored.getOutcome()).isEqualTo(AuditOutcome.SUCCESS);
  }

  @Test
  void rejectsRepeatedIdempotencyAndMissingRequiredFields() {
    UUID correlationId = UUID.randomUUID();
    UUID idempotencyKey = UUID.randomUUID();
    auditRecords.insert(auditRecord(UUID.randomUUID(), correlationId, idempotencyKey));

    assertThatThrownBy(
            () ->
                auditRecords.insert(auditRecord(UUID.randomUUID(), correlationId, idempotencyKey)))
        .isInstanceOf(DataIntegrityViolationException.class);

    assertThatThrownBy(
            () ->
                auditRecords.insert(
                    new AuditRecordEntity(
                        UUID.randomUUID(),
                        NOW,
                        "SYSTEM",
                        null,
                        null,
                        null,
                        "PERSISTENCE_TEST",
                        AuditOutcome.FAILURE,
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        NOW)))
        .isInstanceOf(DataIntegrityViolationException.class);

    assertThatThrownBy(
            () ->
                jdbc.update(
                    """
                    INSERT INTO audit_records (
                      id, occurred_at, actor_type, target_type, action, outcome,
                      correlation_id, idempotency_key, created_at
                    )
                    VALUES (?, ?, 'SYSTEM', 'ACCOUNT', 'PERSISTENCE_TEST', 'UNKNOWN', ?, ?, ?)
                    """,
                    UUID.randomUUID(),
                    Timestamp.from(NOW),
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    Timestamp.from(NOW)))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rollsBackTheGovernedChangeWhenMandatoryAuditInsertFails() {
    UUID accountId = UUID.randomUUID();
    UUID correlationId = UUID.randomUUID();
    UUID idempotencyKey = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    auditRecords.insert(auditRecord(UUID.randomUUID(), correlationId, idempotencyKey));
    TransactionTemplate transaction = new TransactionTemplate(transactionManager);

    assertThatThrownBy(
            () ->
                transaction.executeWithoutResult(
                    status -> {
                      jdbc.update(
                          """
                          UPDATE accounts
                          SET session_epoch = 1, version = version + 1, updated_at = ?
                          WHERE id = ?
                          """,
                          Timestamp.from(NOW.plusSeconds(1)),
                          accountId);
                      auditRecords.insert(
                          auditRecord(UUID.randomUUID(), correlationId, idempotencyKey));
                    }))
        .isInstanceOf(DataIntegrityViolationException.class);

    assertThat(
            jdbc.queryForObject(
                "SELECT session_epoch FROM accounts WHERE id = ?", Long.class, accountId))
        .isZero();
    assertThat(
            jdbc.queryForObject("SELECT version FROM accounts WHERE id = ?", Long.class, accountId))
        .isZero();
  }

  private static AuditRecordEntity auditRecord(UUID id, UUID correlationId, UUID idempotencyKey) {
    return new AuditRecordEntity(
        id,
        NOW,
        "SYSTEM",
        null,
        "ACCOUNT",
        UUID.randomUUID(),
        "PERSISTENCE_TEST",
        AuditOutcome.SUCCESS,
        correlationId,
        idempotencyKey,
        NOW);
  }
}

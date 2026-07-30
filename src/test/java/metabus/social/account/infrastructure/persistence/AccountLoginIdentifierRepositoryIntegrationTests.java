package metabus.social.account.infrastructure.persistence;

import static metabus.social.PersistenceTestData.insertActiveAccount;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import metabus.social.PostgresIntegrationTestSupport;
import metabus.social.account.domain.AccountLoginIdentifierType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.util.ReflectionTestUtils;

class AccountLoginIdentifierRepositoryIntegrationTests extends PostgresIntegrationTestSupport {

  private static final Instant NOW = Instant.parse("2026-07-30T00:00:00Z");
  private static final String NORMALIZED_EMAIL = "Participant@example.com";

  @Autowired private AccountLoginIdentifierRepository identifiers;

  @Test
  void storesAndFindsAnAccountOwnedVerifiedEmailIdentifier() {
    UUID accountId = UUID.randomUUID();
    UUID identifierId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);

    identifiers.saveAndFlush(identifier(identifierId, accountId, NORMALIZED_EMAIL));

    AccountLoginIdentifierEntity byEmail =
        identifiers.findByNormalizedEmailAndRevokedAtIsNull(NORMALIZED_EMAIL).orElseThrow();
    AccountLoginIdentifierEntity byAccount =
        identifiers
            .findByAccountIdAndIdentifierTypeAndRevokedAtIsNull(
                accountId, AccountLoginIdentifierType.EMAIL)
            .orElseThrow();
    assertThat(byEmail.getId()).isEqualTo(identifierId);
    assertThat(byEmail.getAccountId()).isEqualTo(accountId);
    assertThat(byEmail.getIdentifierType()).isEqualTo(AccountLoginIdentifierType.EMAIL);
    assertThat(byEmail.getNormalizedEmail()).isEqualTo(NORMALIZED_EMAIL);
    assertThat(byEmail.getVerifiedAt()).isEqualTo(NOW);
    assertThat(byEmail.getVersion()).isZero();
    assertThat(byEmail.getRevokedAt()).isNull();
    assertThat(byAccount.getId()).isEqualTo(identifierId);
  }

  @Test
  void rejectsTheSameActiveNormalizedEmailForAnotherAccount() {
    UUID firstAccountId = UUID.randomUUID();
    UUID secondAccountId = UUID.randomUUID();
    insertActiveAccount(jdbc, firstAccountId, NOW);
    insertActiveAccount(jdbc, secondAccountId, NOW);
    identifiers.saveAndFlush(identifier(UUID.randomUUID(), firstAccountId, NORMALIZED_EMAIL));

    assertThatThrownBy(
            () ->
                identifiers.saveAndFlush(
                    identifier(UUID.randomUUID(), secondAccountId, NORMALIZED_EMAIL)))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsMultipleActiveEmailIdentifiersForOneAccount() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    identifiers.saveAndFlush(identifier(UUID.randomUUID(), accountId, NORMALIZED_EMAIL));

    assertThatThrownBy(
            () ->
                identifiers.saveAndFlush(
                    identifier(UUID.randomUUID(), accountId, "Replacement@example.com")))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void permitsEmailAndAccountSlotsToBeReusedAfterRevocation() {
    UUID firstAccountId = UUID.randomUUID();
    UUID secondAccountId = UUID.randomUUID();
    insertActiveAccount(jdbc, firstAccountId, NOW);
    insertActiveAccount(jdbc, secondAccountId, NOW);
    identifiers.saveAndFlush(
        identifier(
            UUID.randomUUID(),
            firstAccountId,
            NORMALIZED_EMAIL,
            NOW.plusSeconds(1),
            NOW.plusSeconds(1)));

    AccountLoginIdentifierEntity replacement =
        identifiers.saveAndFlush(
            identifier(UUID.randomUUID(), firstAccountId, "Replacement@example.com"));
    AccountLoginIdentifierEntity reassigned =
        identifiers.saveAndFlush(identifier(UUID.randomUUID(), secondAccountId, NORMALIZED_EMAIL));

    assertThat(
            identifiers
                .findByAccountIdAndIdentifierTypeAndRevokedAtIsNull(
                    firstAccountId, AccountLoginIdentifierType.EMAIL)
                .orElseThrow()
                .getId())
        .isEqualTo(replacement.getId());
    assertThat(
            identifiers
                .findByNormalizedEmailAndRevokedAtIsNull(NORMALIZED_EMAIL)
                .orElseThrow()
                .getId())
        .isEqualTo(reassigned.getId());
  }

  @Test
  void rejectsUnverifiedOrUnnormalizedEmailAndRestrictsAccountDeletion() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);

    assertThatThrownBy(
            () ->
                jdbc.update(
                    """
                    INSERT INTO account_login_identifiers (
                      id, account_id, identifier_type, normalized_email, verified_at,
                      version, created_at, updated_at, revoked_at
                    ) VALUES (?, ?, 'EMAIL', ?, NULL, 0, ?, ?, NULL)
                    """,
                    UUID.randomUUID(),
                    accountId,
                    NORMALIZED_EMAIL,
                    Timestamp.from(NOW),
                    Timestamp.from(NOW)))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThatThrownBy(
            () ->
                identifiers.saveAndFlush(
                    identifier(UUID.randomUUID(), accountId, " participant@example.com ")))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThatThrownBy(
            () ->
                identifiers.saveAndFlush(
                    identifier(
                        UUID.randomUUID(),
                        accountId,
                        "chronology@example.com",
                        NOW.minusSeconds(2),
                        NOW.minusSeconds(1))))
        .isInstanceOf(DataIntegrityViolationException.class);

    identifiers.saveAndFlush(identifier(UUID.randomUUID(), accountId, NORMALIZED_EMAIL));
    assertThatThrownBy(() -> jdbc.update("DELETE FROM accounts WHERE id = ?", accountId))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsAStaleIdentifierVersion() {
    UUID accountId = UUID.randomUUID();
    UUID identifierId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    AccountLoginIdentifierEntity stale =
        identifiers.saveAndFlush(identifier(identifierId, accountId, NORMALIZED_EMAIL));
    jdbc.update(
        """
        UPDATE account_login_identifiers
        SET version = version + 1, updated_at = ?
        WHERE id = ?
        """,
        Timestamp.from(NOW.plusSeconds(1)),
        identifierId);
    ReflectionTestUtils.setField(stale, "updatedAt", NOW.plusSeconds(2));

    assertThatThrownBy(() -> identifiers.saveAndFlush(stale))
        .isInstanceOf(ObjectOptimisticLockingFailureException.class);
  }

  private static AccountLoginIdentifierEntity identifier(
      UUID identifierId, UUID accountId, String normalizedEmail) {
    return identifier(identifierId, accountId, normalizedEmail, NOW, null);
  }

  private static AccountLoginIdentifierEntity identifier(
      UUID identifierId,
      UUID accountId,
      String normalizedEmail,
      Instant updatedAt,
      Instant revokedAt) {
    return new AccountLoginIdentifierEntity(
        identifierId,
        accountId,
        AccountLoginIdentifierType.EMAIL,
        normalizedEmail,
        NOW,
        NOW,
        updatedAt,
        revokedAt);
  }
}

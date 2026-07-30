package metabus.social.authentication.infrastructure.persistence;

import static metabus.social.PersistenceTestData.insertActiveAccount;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import metabus.social.PostgresIntegrationTestSupport;
import metabus.social.authentication.domain.CredentialType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.util.ReflectionTestUtils;

class CredentialRepositoryIntegrationTests extends PostgresIntegrationTestSupport {

  private static final Instant NOW = Instant.parse("2026-07-30T00:00:00Z");
  private static final String OPAQUE_TEST_HASH = "a".repeat(64);

  @Autowired private CredentialRepository credentials;

  @Test
  void storesASeparatedPasswordCredentialForAnAccount() {
    UUID accountId = UUID.randomUUID();
    UUID credentialId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);

    credentials.saveAndFlush(
        new CredentialEntity(
            credentialId, accountId, CredentialType.PASSWORD, OPAQUE_TEST_HASH, NOW, NOW, null));

    CredentialEntity stored =
        credentials
            .findByAccountIdAndCredentialTypeAndRevokedAtIsNull(accountId, CredentialType.PASSWORD)
            .orElseThrow();
    assertThat(stored.getId()).isEqualTo(credentialId);
    assertThat(stored.getAccountId()).isEqualTo(accountId);
    assertThat(stored.getCredentialType()).isEqualTo(CredentialType.PASSWORD);
    assertThat(stored.getPasswordHash()).isEqualTo(OPAQUE_TEST_HASH);
    assertThat(stored.getVersion()).isZero();
    assertThat(stored.getRevokedAt()).isNull();
  }

  @Test
  void rejectsDuplicateActiveCredentialTypes() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    credentials.saveAndFlush(
        new CredentialEntity(
            UUID.randomUUID(),
            accountId,
            CredentialType.PASSWORD,
            OPAQUE_TEST_HASH,
            NOW,
            NOW,
            null));

    assertThatThrownBy(
            () ->
                credentials.saveAndFlush(
                    new CredentialEntity(
                        UUID.randomUUID(),
                        accountId,
                        CredentialType.PASSWORD,
                        "b".repeat(64),
                        NOW,
                        NOW,
                        null)))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsNullHashesAndRestrictsPhysicalAccountDeletion() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);

    assertThatThrownBy(
            () ->
                credentials.saveAndFlush(
                    new CredentialEntity(
                        UUID.randomUUID(),
                        accountId,
                        CredentialType.PASSWORD,
                        null,
                        NOW,
                        NOW,
                        null)))
        .isInstanceOf(DataIntegrityViolationException.class);

    credentials.saveAndFlush(
        new CredentialEntity(
            UUID.randomUUID(),
            accountId,
            CredentialType.PASSWORD,
            OPAQUE_TEST_HASH,
            NOW,
            NOW,
            null));

    assertThatThrownBy(() -> jdbc.update("DELETE FROM accounts WHERE id = ?", accountId))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsAStaleCredentialVersion() {
    UUID accountId = UUID.randomUUID();
    UUID credentialId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    CredentialEntity stale =
        credentials.saveAndFlush(
            new CredentialEntity(
                credentialId,
                accountId,
                CredentialType.PASSWORD,
                OPAQUE_TEST_HASH,
                NOW,
                NOW,
                null));
    jdbc.update(
        "UPDATE account_credentials SET version = version + 1, updated_at = ? WHERE id = ?",
        Timestamp.from(NOW.plusSeconds(1)),
        credentialId);
    ReflectionTestUtils.setField(stale, "updatedAt", NOW.plusSeconds(2));

    assertThatThrownBy(() -> credentials.saveAndFlush(stale))
        .isInstanceOf(ObjectOptimisticLockingFailureException.class);
  }
}

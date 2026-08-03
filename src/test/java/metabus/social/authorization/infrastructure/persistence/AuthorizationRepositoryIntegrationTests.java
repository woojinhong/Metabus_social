package metabus.social.authorization.infrastructure.persistence;

import static metabus.social.PersistenceTestData.insertActiveAccount;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import metabus.social.PostgresIntegrationTestSupport;
import metabus.social.authorization.domain.AuthorizationStatus;
import metabus.social.authorization.domain.AuthorizationTransition;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.util.ReflectionTestUtils;

class AuthorizationRepositoryIntegrationTests extends PostgresIntegrationTestSupport {

  private static final Instant NOW = Instant.parse("2026-07-30T00:00:00Z");

  @Autowired private CurrentAuthorizationRepository currentAuthorizations;
  @Autowired private AuthorizationHistoryRepository authorizationHistory;

  @Test
  void keepsCurrentAuthorizationSeparateFromAppendOnlyHistory() {
    UUID accountId = UUID.randomUUID();
    UUID authorizationId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);

    CurrentAuthorizationEntity current =
        currentAuthorizations.saveAndFlush(
            new CurrentAuthorizationEntity(
                authorizationId,
                accountId,
                "resource.access",
                "resource",
                accountId.toString(),
                AuthorizationStatus.ACTIVE,
                NOW,
                NOW.plusSeconds(3600),
                NOW,
                NOW));
    authorizationHistory.insert(
        new AuthorizationHistoryEntity(
            UUID.randomUUID(),
            authorizationId,
            accountId,
            AuthorizationTransition.GRANTED,
            null,
            AuthorizationStatus.ACTIVE,
            current.getVersion(),
            UUID.randomUUID(),
            UUID.randomUUID(),
            NOW));

    assertThat(currentAuthorizations.findEffectiveByAccountId(accountId, NOW.plusSeconds(1)))
        .singleElement()
        .satisfies(
            stored -> {
              assertThat(stored.getAuthority()).isEqualTo("resource.access");
              assertThat(stored.getScopeType()).isEqualTo("resource");
              assertThat(stored.getScopeReference()).isEqualTo(accountId.toString());
            });
    assertThat(authorizationHistory.findByAuthorizationIdOrderByChangedAtAsc(authorizationId))
        .singleElement()
        .satisfies(
            stored -> {
              assertThat(stored.getAuthorizationId()).isEqualTo(authorizationId);
              assertThat(stored.getTransition()).isEqualTo(AuthorizationTransition.GRANTED);
            });
  }

  @Test
  void includesActiveAuthorizationWhenValidFromEqualsNow() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.valid-from-now",
            "resource",
            "valid-from-now",
            AuthorizationStatus.ACTIVE,
            NOW,
            NOW.plusSeconds(3600),
            NOW,
            NOW));

    assertThat(currentAuthorizations.findEffectiveByAccountId(accountId, NOW))
        .extracting(CurrentAuthorizationEntity::getAuthority)
        .containsExactly("boundary.valid-from-now");
  }

  @Test
  void includesActiveAuthorizationWhenExpiresAtIsNull() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.no-expiry",
            "resource",
            "no-expiry",
            AuthorizationStatus.ACTIVE,
            NOW.minusSeconds(1),
            null,
            NOW.minusSeconds(1),
            NOW));

    assertThat(currentAuthorizations.findEffectiveByAccountId(accountId, NOW))
        .extracting(CurrentAuthorizationEntity::getAuthority)
        .containsExactly("boundary.no-expiry");
  }

  @Test
  void excludesActiveAuthorizationWhenValidFromIsAfterNow() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.current-control",
            "resource",
            "future-valid-from-control",
            AuthorizationStatus.ACTIVE,
            NOW,
            null,
            NOW,
            NOW));
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.future-valid-from",
            "resource",
            "future-valid-from",
            AuthorizationStatus.ACTIVE,
            NOW.plusSeconds(1),
            null,
            NOW,
            NOW));

    assertThat(currentAuthorizations.findEffectiveByAccountId(accountId, NOW))
        .extracting(CurrentAuthorizationEntity::getAuthority)
        .contains("boundary.current-control")
        .doesNotContain("boundary.future-valid-from");
  }

  @Test
  void excludesActiveAuthorizationWhenExpiresAtEqualsNow() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.current-control",
            "resource",
            "expires-at-now-control",
            AuthorizationStatus.ACTIVE,
            NOW.minusSeconds(1),
            null,
            NOW.minusSeconds(1),
            NOW));
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.expires-at-now",
            "resource",
            "expires-at-now",
            AuthorizationStatus.ACTIVE,
            NOW.minusSeconds(1),
            NOW,
            NOW.minusSeconds(1),
            NOW));

    assertThat(currentAuthorizations.findEffectiveByAccountId(accountId, NOW))
        .extracting(CurrentAuthorizationEntity::getAuthority)
        .contains("boundary.current-control")
        .doesNotContain("boundary.expires-at-now");
  }

  @Test
  void excludesRevokedAuthorizationEvenWithinEffectiveTimeRange() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.current-control",
            "resource",
            "revoked-control",
            AuthorizationStatus.ACTIVE,
            NOW.minusSeconds(1),
            null,
            NOW.minusSeconds(1),
            NOW));
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.revoked",
            "resource",
            "revoked",
            AuthorizationStatus.REVOKED,
            NOW.minusSeconds(1),
            NOW.plusSeconds(1),
            NOW.minusSeconds(1),
            NOW));

    assertThat(currentAuthorizations.findEffectiveByAccountId(accountId, NOW))
        .extracting(CurrentAuthorizationEntity::getAuthority)
        .contains("boundary.current-control")
        .doesNotContain("boundary.revoked");
  }

  @Test
  void excludesExpiredAuthorizationEvenWithinEffectiveTimeRange() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.current-control",
            "resource",
            "expired-control",
            AuthorizationStatus.ACTIVE,
            NOW.minusSeconds(1),
            null,
            NOW.minusSeconds(1),
            NOW));
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "boundary.expired",
            "resource",
            "expired",
            AuthorizationStatus.EXPIRED,
            NOW.minusSeconds(1),
            NOW.plusSeconds(1),
            NOW.minusSeconds(1),
            NOW));

    assertThat(currentAuthorizations.findEffectiveByAccountId(accountId, NOW))
        .extracting(CurrentAuthorizationEntity::getAuthority)
        .contains("boundary.current-control")
        .doesNotContain("boundary.expired");
  }

  @Test
  void permitsRegrantAfterRevocationButRejectsDuplicateActiveScope() {
    UUID accountId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);

    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "resource.access",
            "resource",
            null,
            AuthorizationStatus.REVOKED,
            NOW,
            null,
            NOW,
            NOW));
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            UUID.randomUUID(),
            accountId,
            "resource.access",
            "resource",
            null,
            AuthorizationStatus.ACTIVE,
            NOW.plusSeconds(1),
            null,
            NOW.plusSeconds(1),
            NOW.plusSeconds(1)));

    assertThatThrownBy(
            () ->
                currentAuthorizations.saveAndFlush(
                    new CurrentAuthorizationEntity(
                        UUID.randomUUID(),
                        accountId,
                        "resource.access",
                        "resource",
                        null,
                        AuthorizationStatus.ACTIVE,
                        NOW.plusSeconds(2),
                        null,
                        NOW.plusSeconds(2),
                        NOW.plusSeconds(2))))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsHistoryThatAttributesAnAuthorizationToAnotherAccount() {
    UUID ownerAccountId = UUID.randomUUID();
    UUID differentAccountId = UUID.randomUUID();
    UUID authorizationId = UUID.randomUUID();
    insertActiveAccount(jdbc, ownerAccountId, NOW);
    insertActiveAccount(jdbc, differentAccountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            authorizationId,
            ownerAccountId,
            "resource.access",
            "resource",
            null,
            AuthorizationStatus.ACTIVE,
            NOW,
            null,
            NOW,
            NOW));

    assertThatThrownBy(
            () ->
                authorizationHistory.insert(
                    new AuthorizationHistoryEntity(
                        UUID.randomUUID(),
                        authorizationId,
                        differentAccountId,
                        AuthorizationTransition.GRANTED,
                        null,
                        AuthorizationStatus.ACTIVE,
                        0,
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        NOW)))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsDuplicateHistoryVersionsForTheSameAuthorization() {
    UUID accountId = UUID.randomUUID();
    UUID authorizationId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            authorizationId,
            accountId,
            "resource.access",
            "resource",
            accountId.toString(),
            AuthorizationStatus.ACTIVE,
            NOW,
            null,
            NOW,
            NOW));

    AuthorizationHistoryEntity first =
        new AuthorizationHistoryEntity(
            UUID.randomUUID(),
            authorizationId,
            accountId,
            AuthorizationTransition.GRANTED,
            null,
            AuthorizationStatus.ACTIVE,
            0,
            UUID.randomUUID(),
            UUID.randomUUID(),
            NOW);
    authorizationHistory.insert(first);

    assertThatThrownBy(
            () ->
                authorizationHistory.insert(
                    new AuthorizationHistoryEntity(
                        UUID.randomUUID(),
                        authorizationId,
                        accountId,
                        AuthorizationTransition.REVOKED,
                        AuthorizationStatus.ACTIVE,
                        AuthorizationStatus.REVOKED,
                        0,
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        NOW.plusSeconds(1))))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsContradictoryAuthorizationHistoryTransitions() {
    UUID accountId = UUID.randomUUID();
    UUID authorizationId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            authorizationId,
            accountId,
            "resource.access",
            "resource",
            accountId.toString(),
            AuthorizationStatus.ACTIVE,
            NOW,
            null,
            NOW,
            NOW));

    assertThatThrownBy(
            () ->
                authorizationHistory.insert(
                    new AuthorizationHistoryEntity(
                        UUID.randomUUID(),
                        authorizationId,
                        accountId,
                        AuthorizationTransition.GRANTED,
                        null,
                        AuthorizationStatus.REVOKED,
                        0,
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        NOW)))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsReusingAnAppendOnlyHistoryIdWithoutChangingTheOriginalEvidence() {
    UUID accountId = UUID.randomUUID();
    UUID authorizationId = UUID.randomUUID();
    UUID historyId = UUID.randomUUID();
    UUID originalCorrelationId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    currentAuthorizations.saveAndFlush(
        new CurrentAuthorizationEntity(
            authorizationId,
            accountId,
            "resource.access",
            "resource",
            accountId.toString(),
            AuthorizationStatus.ACTIVE,
            NOW,
            null,
            NOW,
            NOW));
    authorizationHistory.insert(
        new AuthorizationHistoryEntity(
            historyId,
            authorizationId,
            accountId,
            AuthorizationTransition.GRANTED,
            null,
            AuthorizationStatus.ACTIVE,
            0,
            UUID.randomUUID(),
            originalCorrelationId,
            NOW));

    assertThatThrownBy(
            () ->
                authorizationHistory.insert(
                    new AuthorizationHistoryEntity(
                        historyId,
                        authorizationId,
                        accountId,
                        AuthorizationTransition.REVOKED,
                        AuthorizationStatus.ACTIVE,
                        AuthorizationStatus.REVOKED,
                        1,
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        NOW.plusSeconds(1))))
        .isInstanceOf(DataIntegrityViolationException.class);

    assertThat(
            jdbc.queryForObject(
                "SELECT correlation_id FROM authorization_history WHERE id = ?",
                UUID.class,
                historyId))
        .isEqualTo(originalCorrelationId);
  }

  @Test
  void rejectsAStaleCurrentAuthorizationVersion() {
    UUID accountId = UUID.randomUUID();
    UUID authorizationId = UUID.randomUUID();
    insertActiveAccount(jdbc, accountId, NOW);
    CurrentAuthorizationEntity stale =
        currentAuthorizations.saveAndFlush(
            new CurrentAuthorizationEntity(
                authorizationId,
                accountId,
                "resource.access",
                "resource",
                accountId.toString(),
                AuthorizationStatus.ACTIVE,
                NOW,
                null,
                NOW,
                NOW));
    jdbc.update(
        "UPDATE current_authorizations SET version = version + 1, updated_at = ? WHERE id = ?",
        Timestamp.from(NOW.plusSeconds(1)),
        authorizationId);
    ReflectionTestUtils.setField(stale, "updatedAt", NOW.plusSeconds(2));

    assertThatThrownBy(() -> currentAuthorizations.saveAndFlush(stale))
        .isInstanceOf(ObjectOptimisticLockingFailureException.class);
  }
}

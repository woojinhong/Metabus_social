package metabus.social.account.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.RollbackException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import metabus.social.PostgresIntegrationTestSupport;
import metabus.social.account.domain.AccountStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

class AccountRepositoryIntegrationTests extends PostgresIntegrationTestSupport {

  private static final Instant NOW = Instant.parse("2026-07-30T00:00:00Z");

  @Autowired private AccountRepository accounts;
  @Autowired private AccountStatusHistoryRepository accountStatusHistory;
  @Autowired private EntityManagerFactory entityManagerFactory;
  @Autowired private PlatformTransactionManager transactionManager;

  @Test
  void storesLifecycleStateEpochsAndVersion() {
    UUID accountId = UUID.randomUUID();

    accounts.saveAndFlush(new AccountEntity(accountId, AccountStatus.ACTIVE, 4, 7, NOW, NOW));

    AccountEntity stored = accounts.findById(accountId).orElseThrow();
    assertThat(stored.getStatus()).isEqualTo(AccountStatus.ACTIVE);
    assertThat(stored.getSessionEpoch()).isEqualTo(4);
    assertThat(stored.getAuthorizationEpoch()).isEqualTo(7);
    assertThat(stored.getVersion()).isZero();
  }

  @Test
  void rejectsNegativeEpochsAtTheDatabaseBoundary() {
    UUID accountId = UUID.randomUUID();

    assertThatThrownBy(
            () ->
                accounts.saveAndFlush(
                    new AccountEntity(accountId, AccountStatus.ACTIVE, -1, 0, NOW, NOW)))
        .isInstanceOf(DataIntegrityViolationException.class);

    assertThat(accounts.findById(accountId)).isEmpty();
  }

  @Test
  void recordsOneHistoryEntryPerAccountVersion() {
    UUID accountId = UUID.randomUUID();
    accounts.saveAndFlush(new AccountEntity(accountId, AccountStatus.ACTIVE, 0, 0, NOW, NOW));
    accountStatusHistory.insert(
        new AccountStatusHistoryEntity(
            UUID.randomUUID(),
            accountId,
            null,
            AccountStatus.ACTIVE,
            0,
            null,
            "CREATED",
            UUID.randomUUID(),
            NOW));

    assertThat(accountStatusHistory.count()).isEqualTo(1);
    assertThatThrownBy(
            () ->
                accountStatusHistory.insert(
                    new AccountStatusHistoryEntity(
                        UUID.randomUUID(),
                        accountId,
                        AccountStatus.ACTIVE,
                        AccountStatus.SUSPENDED,
                        0,
                        UUID.randomUUID(),
                        "DUPLICATE_VERSION",
                        UUID.randomUUID(),
                        NOW.plusSeconds(1))))
        .isInstanceOf(DataIntegrityViolationException.class);

    assertThatThrownBy(
            () ->
                accountStatusHistory.insert(
                    new AccountStatusHistoryEntity(
                        UUID.randomUUID(),
                        accountId,
                        AccountStatus.ACTIVE,
                        AccountStatus.ACTIVE,
                        1,
                        UUID.randomUUID(),
                        "INVALID_TRANSITION",
                        UUID.randomUUID(),
                        NOW.plusSeconds(2))))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void rejectsAnOptimisticUpdateFromAStaleVersion() {
    UUID accountId = UUID.randomUUID();
    accounts.saveAndFlush(new AccountEntity(accountId, AccountStatus.ACTIVE, 0, 0, NOW, NOW));

    EntityManager first = entityManagerFactory.createEntityManager();
    EntityManager stale = entityManagerFactory.createEntityManager();
    try {
      first.getTransaction().begin();
      stale.getTransaction().begin();
      AccountEntity firstCopy = first.find(AccountEntity.class, accountId);
      AccountEntity staleCopy = stale.find(AccountEntity.class, accountId);

      ReflectionTestUtils.setField(firstCopy, "updatedAt", NOW.plusSeconds(1));
      first.getTransaction().commit();

      ReflectionTestUtils.setField(staleCopy, "updatedAt", NOW.plusSeconds(2));
      assertThatThrownBy(stale.getTransaction()::commit).isInstanceOf(RollbackException.class);
    } finally {
      if (first.getTransaction().isActive()) {
        first.getTransaction().rollback();
      }
      if (stale.getTransaction().isActive()) {
        stale.getTransaction().rollback();
      }
      first.close();
      stale.close();
    }

    assertThat(accounts.findById(accountId).orElseThrow().getVersion()).isEqualTo(1);
  }

  @Test
  void serializesPessimisticLocksOnTheSameAccountRow()
      throws InterruptedException, ExecutionException, TimeoutException {
    UUID accountId = UUID.randomUUID();
    accounts.saveAndFlush(new AccountEntity(accountId, AccountStatus.ACTIVE, 0, 0, NOW, NOW));
    TransactionTemplate transaction = new TransactionTemplate(transactionManager);
    CountDownLatch firstLocked = new CountDownLatch(1);
    CountDownLatch releaseFirst = new CountDownLatch(1);
    CountDownLatch secondAttemptingLock = new CountDownLatch(1);

    try (var executor = Executors.newFixedThreadPool(2)) {
      var first =
          executor.submit(
              () ->
                  transaction.executeWithoutResult(
                      status -> {
                        accounts.findByIdForUpdate(accountId).orElseThrow();
                        firstLocked.countDown();
                        await(releaseFirst);
                      }));

      assertThat(firstLocked.await(5, TimeUnit.SECONDS)).isTrue();

      var second =
          executor.submit(
              () ->
                  transaction.executeWithoutResult(
                      status -> {
                        secondAttemptingLock.countDown();
                        accounts.findByIdForUpdate(accountId).orElseThrow();
                      }));

      assertThat(secondAttemptingLock.await(5, TimeUnit.SECONDS)).isTrue();
      assertThatThrownBy(() -> second.get(500, TimeUnit.MILLISECONDS))
          .isInstanceOf(TimeoutException.class);

      releaseFirst.countDown();
      first.get(5, TimeUnit.SECONDS);
      second.get(5, TimeUnit.SECONDS);
    } finally {
      releaseFirst.countDown();
    }
  }

  private static void await(CountDownLatch latch) {
    try {
      if (!latch.await(5, TimeUnit.SECONDS)) {
        throw new IllegalStateException("Timed out waiting for the test lock release");
      }
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException(
          "Interrupted while waiting for the test lock release", exception);
    }
  }
}

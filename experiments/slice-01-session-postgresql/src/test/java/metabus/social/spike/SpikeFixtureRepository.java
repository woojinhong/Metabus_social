package metabus.social.spike;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

final class SpikeFixtureRepository {

  static final UUID ACTIVE_ACCOUNT = UUID.fromString("10000000-0000-0000-0000-000000000001");
  static final UUID SUSPENDED_ACCOUNT = UUID.fromString("10000000-0000-0000-0000-000000000002");
  static final UUID CLOSED_ACCOUNT = UUID.fromString("10000000-0000-0000-0000-000000000003");

  private final JdbcTemplate jdbc;
  private final TransactionTemplate transactions;

  SpikeFixtureRepository(JdbcTemplate jdbc, PlatformTransactionManager transactionManager) {
    this.jdbc = jdbc;
    this.transactions = new TransactionTemplate(transactionManager);
  }

  void reset() {
    jdbc.update("DELETE FROM SPRING_SESSION_ATTRIBUTES");
    jdbc.update("DELETE FROM SPRING_SESSION");
    jdbc.update("DELETE FROM SPIKE_AUDIT_FIXTURE");
    jdbc.update("DELETE FROM SPIKE_SESSION_ACTION");
    jdbc.update("DELETE FROM SPIKE_ACCOUNT_GUARD");
    insertAccount(ACTIVE_ACCOUNT, "active-user", "ACTIVE");
    insertAccount(SUSPENDED_ACCOUNT, "suspended-user", "SUSPENDED");
    insertAccount(CLOSED_ACCOUNT, "closed-user", "ACCESS_CLOSED");
  }

  private void insertAccount(UUID id, String loginName, String status) {
    jdbc.update(
        """
                INSERT INTO SPIKE_ACCOUNT_GUARD
                  (ACCOUNT_ID, LOGIN_NAME, ACCOUNT_STATUS, ROW_VERSION,
                   SESSION_EPOCH, AUTHORIZATION_EPOCH, BUSINESS_VALUE)
                VALUES (?, ?, ?, 0, 0, 0, 0)
                """,
        id,
        loginName,
        status);
  }

  Optional<AccountSnapshot> findByLoginName(String loginName) {
    List<AccountSnapshot> values =
        jdbc.query(
            """
                        SELECT ACCOUNT_ID, LOGIN_NAME, ACCOUNT_STATUS, ROW_VERSION,
                               SESSION_EPOCH, AUTHORIZATION_EPOCH, BUSINESS_VALUE
                        FROM SPIKE_ACCOUNT_GUARD WHERE LOGIN_NAME = ?
                        """,
            (resultSet, rowNumber) ->
                new AccountSnapshot(
                    resultSet.getObject("ACCOUNT_ID", UUID.class),
                    resultSet.getString("LOGIN_NAME"),
                    resultSet.getString("ACCOUNT_STATUS"),
                    resultSet.getLong("ROW_VERSION"),
                    resultSet.getLong("SESSION_EPOCH"),
                    resultSet.getLong("AUTHORIZATION_EPOCH"),
                    resultSet.getInt("BUSINESS_VALUE")),
            loginName);
    return values.stream().findFirst();
  }

  AccountSnapshot find(UUID accountId) {
    return jdbc.queryForObject(
        """
                SELECT ACCOUNT_ID, LOGIN_NAME, ACCOUNT_STATUS, ROW_VERSION,
                       SESSION_EPOCH, AUTHORIZATION_EPOCH, BUSINESS_VALUE
                FROM SPIKE_ACCOUNT_GUARD WHERE ACCOUNT_ID = ?
                """,
        (resultSet, rowNumber) ->
            new AccountSnapshot(
                resultSet.getObject("ACCOUNT_ID", UUID.class),
                resultSet.getString("LOGIN_NAME"),
                resultSet.getString("ACCOUNT_STATUS"),
                resultSet.getLong("ROW_VERSION"),
                resultSet.getLong("SESSION_EPOCH"),
                resultSet.getLong("AUTHORIZATION_EPOCH"),
                resultSet.getInt("BUSINESS_VALUE")),
        accountId);
  }

  long captureSessionEpoch(UUID accountId) {
    return transactions.execute(
        status ->
            jdbc.queryForObject(
                """
                                SELECT SESSION_EPOCH FROM SPIKE_ACCOUNT_GUARD
                                WHERE ACCOUNT_ID = ? AND ACCOUNT_STATUS = 'ACTIVE'
                                FOR UPDATE
                                """,
                Long.class,
                accountId));
  }

  void suspend(UUID accountId) {
    suspendHolding(
        accountId,
        new java.util.concurrent.CountDownLatch(0),
        new java.util.concurrent.CountDownLatch(0),
        new java.util.concurrent.CountDownLatch(0));
  }

  void suspendHolding(
      UUID accountId,
      java.util.concurrent.CountDownLatch updateAttempted,
      java.util.concurrent.CountDownLatch rowUpdated,
      java.util.concurrent.CountDownLatch release) {
    transactions.executeWithoutResult(
        ignored -> {
          updateAttempted.countDown();
          int changed =
              jdbc.update(
                  """
                                    UPDATE SPIKE_ACCOUNT_GUARD
                                    SET ACCOUNT_STATUS = 'SUSPENDED',
                                        ROW_VERSION = ROW_VERSION + 1,
                                        SESSION_EPOCH = SESSION_EPOCH + 1,
                                        AUTHORIZATION_EPOCH = AUTHORIZATION_EPOCH + 1
                                    WHERE ACCOUNT_ID = ?
                                    """,
                  accountId);
          if (changed != 1) {
            throw new IllegalStateException("Account suspension fixture updated no row");
          }
          rowUpdated.countDown();
          SpikeRaceControl.await(release, java.time.Duration.ofSeconds(10));
        });
  }

  void revokeAll(UUID accountId) {
    transactions.executeWithoutResult(
        ignored ->
            jdbc.update(
                """
                                UPDATE SPIKE_ACCOUNT_GUARD
                                SET SESSION_EPOCH = SESSION_EPOCH + 1,
                                    ROW_VERSION = ROW_VERSION + 1
                                WHERE ACCOUNT_ID = ?
                                """,
                accountId));
  }

  void restoreWithoutEpochRollback(UUID accountId) {
    transactions.executeWithoutResult(
        ignored ->
            jdbc.update(
                """
                                UPDATE SPIKE_ACCOUNT_GUARD
                                SET ACCOUNT_STATUS = 'ACTIVE', ROW_VERSION = ROW_VERSION + 1
                                WHERE ACCOUNT_ID = ?
                                """,
                accountId));
  }

  void guardedBusinessCommand(
      UUID accountId,
      java.util.concurrent.CountDownLatch lockAcquired,
      java.util.concurrent.CountDownLatch release) {
    guardedBusinessCommand(
        accountId, new java.util.concurrent.CountDownLatch(0), lockAcquired, release);
  }

  void guardedBusinessCommand(
      UUID accountId,
      java.util.concurrent.CountDownLatch lockAttempted,
      java.util.concurrent.CountDownLatch lockAcquired,
      java.util.concurrent.CountDownLatch release) {
    transactions.executeWithoutResult(
        ignored -> {
          lockAttempted.countDown();
          String state =
              jdbc.queryForObject(
                  """
                                    SELECT ACCOUNT_STATUS FROM SPIKE_ACCOUNT_GUARD
                                    WHERE ACCOUNT_ID = ? FOR UPDATE
                                    """,
                  String.class,
                  accountId);
          if (!"ACTIVE".equals(state)) {
            throw new IllegalStateException("Account guard rejected inactive account");
          }
          lockAcquired.countDown();
          SpikeRaceControl.await(release, java.time.Duration.ofSeconds(10));
          jdbc.update(
              """
                            UPDATE SPIKE_ACCOUNT_GUARD
                            SET BUSINESS_VALUE = BUSINESS_VALUE + 1,
                                ROW_VERSION = ROW_VERSION + 1
                            WHERE ACCOUNT_ID = ? AND ACCOUNT_STATUS = 'ACTIVE'
                            """,
              accountId);
        });
  }

  JdbcTemplate jdbc() {
    return jdbc;
  }

  record AccountSnapshot(
      UUID accountId,
      String loginName,
      String status,
      long version,
      long sessionEpoch,
      long authorizationEpoch,
      int businessValue) {}
}

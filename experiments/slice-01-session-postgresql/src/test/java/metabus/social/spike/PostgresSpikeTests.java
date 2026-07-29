package metabus.social.spike;

import static metabus.social.spike.SpikeSecurityFixtures.ACCOUNT_ID;
import static metabus.social.spike.SpikeSecurityFixtures.FIXTURE_PASSWORD;
import static metabus.social.spike.SpikeSecurityFixtures.ISSUED_SESSION_EPOCH;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.http.Cookie;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;
import org.springframework.session.jdbc.JdbcIndexedSessionRepository;
import org.springframework.session.jdbc.PostgreSqlJdbcIndexedSessionRepositoryCustomizer;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers
@SpringBootTest(
    classes = SpikeTestApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(SpikeFixtureConfiguration.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PostgresSpikeTests {

  @Container
  static final PostgreSQLContainer POSTGRES =
      new PostgreSQLContainer("postgres:18-alpine")
          .withDatabaseName("slice01_spike")
          .withUsername("spike")
          .withPassword("spike-local-only");

  @DynamicPropertySource
  static void postgresProperties(DynamicPropertyRegistry registry) {
    // Spring resolves datasource properties while building its context. Start explicitly so that
    // the mapped port exists regardless of JUnit extension ordering on the CI runner.
    if (!POSTGRES.isRunning()) {
      POSTGRES.start();
    }
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
  }

  @Autowired private MockMvc mockMvc;
  @Autowired private DataSource dataSource;
  @Autowired private PlatformTransactionManager transactionManager;
  @Autowired private SpikeFixtureRepository fixtures;
  @Autowired private SpikeRaceControl races;
  @Autowired private SpikeSecurityFixtures.FixtureAuthenticationProvider authenticationProvider;

  @Autowired
  @Qualifier("sessionRepository")
  private JdbcIndexedSessionRepository sessions;

  @LocalServerPort private int port;

  private HttpClient http;
  private JdbcTemplate jdbc;
  private SessionRepository<Session> sessionStore;
  private TransactionTemplate transactions;

  @BeforeEach
  void resetFixtures() {
    fixtures.reset();
    authenticationProvider.internalReasons().clear();
    http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    jdbc = fixtures.jdbc();
    sessionStore = asSessionStore(sessions);
    transactions = new TransactionTemplate(transactionManager);
  }

  @AfterAll
  void containerWasActuallyUsed() {
    assertThat(POSTGRES.isRunning()).isTrue();
  }

  @Test
  void flywayAppliesOfficialSessionSchemaAndExperimentFixtures() {
    assertThat(tableExists("spring_session")).isTrue();
    assertThat(tableExists("spring_session_attributes")).isTrue();
    assertThat(tableExists("spike_account_guard")).isTrue();
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version IN ('001','002')",
                Integer.class))
        .isEqualTo(2);
  }

  @Test
  void defaultSessionOperationsCommitIndependentlyWithRequiresNew() {
    Session created = sessionStore.createSession();
    String id = created.getId();

    transactions.executeWithoutResult(
        status -> {
          sessionStore.save(created);
          status.setRollbackOnly();
        });
    assertThat(sessionStore.findById(id)).isNotNull();

    transactions.executeWithoutResult(
        status -> {
          sessionStore.deleteById(id);
          status.setRollbackOnly();
        });
    assertThat(sessionStore.findById(id)).isNull();
  }

  @Test
  void customRequiredRepositoryCanJoinAccountSessionAndAuditRollback() {
    var transactionOperations = new TransactionTemplate(transactionManager);
    var customRepository =
        new JdbcIndexedSessionRepository(new JdbcTemplate(dataSource), transactionOperations);
    new PostgreSqlJdbcIndexedSessionRepositoryCustomizer().customize(customRepository);
    customRepository.setCleanupCron("-");
    customRepository.afterPropertiesSet();
    try {
      var customStore = asSessionStore(customRepository);
      Session session = customStore.createSession();
      customStore.save(session);

      assertThatThrownBy(
              () ->
                  transactions.executeWithoutResult(
                      ignored -> {
                        jdbc.update(
                            """
                                                        UPDATE SPIKE_ACCOUNT_GUARD
                                                        SET ACCOUNT_STATUS='SUSPENDED',
                                                            SESSION_EPOCH=SESSION_EPOCH+1
                                                        WHERE ACCOUNT_ID=?
                                                        """,
                            SpikeFixtureRepository.ACTIVE_ACCOUNT);
                        customStore.deleteById(session.getId());
                        insertInvalidAudit();
                      }))
          .isInstanceOf(DataIntegrityViolationException.class);

      assertThat(fixtures.find(SpikeFixtureRepository.ACTIVE_ACCOUNT).status()).isEqualTo("ACTIVE");
      assertThat(customStore.findById(session.getId())).isNotNull();
      assertThat(count("SPIKE_AUDIT_FIXTURE")).isZero();
    } finally {
      customRepository.destroy();
    }
  }

  @Test
  void suspensionAndEpochRejectExistingCookieWithoutDeletingSession() throws Exception {
    String cookie = issueFixtureSession();
    assertThat(sessionStore.findById(cookie)).isNotNull();

    fixtures.suspend(SpikeFixtureRepository.ACTIVE_ACCOUNT);
    assertThat(getWithCookie("/spike/probe", cookie).statusCode()).isEqualTo(403);
    assertThat(sessionStore.findById(cookie)).isNotNull();

    fixtures.restoreWithoutEpochRollback(SpikeFixtureRepository.ACTIVE_ACCOUNT);
    assertThat(getWithCookie("/spike/probe", cookie).statusCode()).isEqualTo(403);
  }

  @Test
  void loginSavedAfterRevokeAllUsesStaleEpochAndIsRejected() throws Exception {
    var gate = races.armLogin();
    var login =
        http.sendAsync(
            request("/spike/login-fixture").GET().build(), HttpResponse.BodyHandlers.discarding());
    SpikeRaceControl.await(gate.arrived, Duration.ofSeconds(10));

    fixtures.revokeAll(SpikeFixtureRepository.ACTIVE_ACCOUNT);
    gate.release.countDown();

    var staleLogin = login.get(10, TimeUnit.SECONDS);
    String staleCookie = sessionCookie(staleLogin);
    assertThat(getWithCookie("/spike/probe", staleCookie).statusCode()).isEqualTo(403);

    String currentCookie = issueFixtureSession();
    assertThat(getWithCookie("/spike/probe", currentCookie).statusCode()).isEqualTo(200);
  }

  @Test
  void deleteByIdIsNotUndoneByConcurrentFilterSave() throws Exception {
    String cookie = issueFixtureSession();
    var gate = races.armRequest();
    var inFlight =
        http.sendAsync(
            request("/spike/hold").header("Cookie", cookieHeader(cookie)).GET().build(),
            HttpResponse.BodyHandlers.discarding());
    SpikeRaceControl.await(gate.arrived, Duration.ofSeconds(10));

    sessionStore.deleteById(cookie);
    assertThat(sessionStore.findById(cookie)).isNull();
    gate.release.countDown();

    assertThat(inFlight.get(10, TimeUnit.SECONDS).statusCode()).isEqualTo(204);
    assertThat(sessionStore.findById(cookie)).isNull();
    assertThat(getWithCookie("/spike/secured", cookie).statusCode()).isEqualTo(401);
  }

  @Test
  void accountGuardSerializesBusinessCommandAndSuspensionWithoutLateCommit() throws Exception {
    var suspensionUpdated = new CountDownLatch(1);
    var releaseSuspension = new CountDownLatch(1);
    var businessAttempted = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var suspension =
          executor.submit(
              () ->
                  fixtures.suspendHolding(
                      SpikeFixtureRepository.ACTIVE_ACCOUNT,
                      new CountDownLatch(0),
                      suspensionUpdated,
                      releaseSuspension));
      SpikeRaceControl.await(suspensionUpdated, Duration.ofSeconds(10));
      var business =
          executor.submit(
              () ->
                  fixtures.guardedBusinessCommand(
                      SpikeFixtureRepository.ACTIVE_ACCOUNT,
                      businessAttempted,
                      new CountDownLatch(1),
                      new CountDownLatch(0)));
      SpikeRaceControl.await(businessAttempted, Duration.ofSeconds(10));
      assertThat(business.isDone()).isFalse();
      releaseSuspension.countDown();
      suspension.get(10, TimeUnit.SECONDS);
      assertThatThrownBy(() -> business.get(10, TimeUnit.SECONDS))
          .isInstanceOf(ExecutionException.class)
          .hasCauseInstanceOf(IllegalStateException.class);
    }
    assertThat(fixtures.find(SpikeFixtureRepository.ACTIVE_ACCOUNT).businessValue()).isZero();

    fixtures.reset();
    var lockAcquired = new CountDownLatch(1);
    var releaseBusiness = new CountDownLatch(1);
    var suspensionAttempted = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var business =
          executor.submit(
              () ->
                  fixtures.guardedBusinessCommand(
                      SpikeFixtureRepository.ACTIVE_ACCOUNT, lockAcquired, releaseBusiness));
      SpikeRaceControl.await(lockAcquired, Duration.ofSeconds(10));
      var suspension =
          executor.submit(
              () ->
                  fixtures.suspendHolding(
                      SpikeFixtureRepository.ACTIVE_ACCOUNT,
                      suspensionAttempted,
                      new CountDownLatch(1),
                      new CountDownLatch(0)));
      SpikeRaceControl.await(suspensionAttempted, Duration.ofSeconds(10));
      assertThat(suspension.isDone()).isFalse();
      releaseBusiness.countDown();
      business.get(10, TimeUnit.SECONDS);
      suspension.get(10, TimeUnit.SECONDS);
    }

    var finalAccount = fixtures.find(SpikeFixtureRepository.ACTIVE_ACCOUNT);
    assertThat(finalAccount.businessValue()).isOne();
    assertThat(finalAccount.status()).isEqualTo("SUSPENDED");
  }

  @Test
  void auditConstraintFailureRollsBackAccountStateAndEpochs() {
    var before = fixtures.find(SpikeFixtureRepository.ACTIVE_ACCOUNT);
    assertThatThrownBy(
            () ->
                transactions.executeWithoutResult(
                    ignored -> {
                      jdbc.update(
                          """
                                                    UPDATE SPIKE_ACCOUNT_GUARD
                                                    SET ACCOUNT_STATUS='SUSPENDED',
                                                        ROW_VERSION=ROW_VERSION+1,
                                                        SESSION_EPOCH=SESSION_EPOCH+1,
                                                        AUTHORIZATION_EPOCH=AUTHORIZATION_EPOCH+1
                                                    WHERE ACCOUNT_ID=?
                                                    """,
                          SpikeFixtureRepository.ACTIVE_ACCOUNT);
                      insertInvalidAudit();
                    }))
        .isInstanceOf(DataIntegrityViolationException.class);

    var after = fixtures.find(SpikeFixtureRepository.ACTIVE_ACCOUNT);
    assertThat(after.status()).isEqualTo(before.status());
    assertThat(after.version()).isEqualTo(before.version());
    assertThat(after.sessionEpoch()).isEqualTo(before.sessionEpoch());
    assertThat(after.authorizationEpoch()).isEqualTo(before.authorizationEpoch());
    assertThat(count("SPIKE_AUDIT_FIXTURE")).isZero();
  }

  @Test
  void springSecurityRotatesSessionAndRejectsPreviousIdentifier() throws Exception {
    var preAuthentication = mockMvc.perform(get("/spike/preauth")).andReturn();
    Cookie oldCookie = preAuthentication.getResponse().getCookie("SPIKE_SESSION");
    assertThat(oldCookie).isNotNull();

    var login =
        mockMvc
            .perform(
                post("/login")
                    .with(csrf())
                    .cookie(oldCookie)
                    .param("username", "active-user")
                    .param("password", FIXTURE_PASSWORD))
            .andReturn();
    assertThat(login.getResponse().getStatus()).isEqualTo(204);
    Cookie newCookie = login.getResponse().getCookie("SPIKE_SESSION");
    assertThat(newCookie).isNotNull();
    assertThat(newCookie.getValue()).isNotEqualTo(oldCookie.getValue());

    assertThat(getWithCookie("/spike/secured", oldCookie.getValue()).statusCode()).isEqualTo(401);
    assertThat(getWithCookie("/spike/secured", newCookie.getValue()).statusCode()).isEqualTo(200);
    assertThat(sessionStore.findById(oldCookie.getValue())).isNull();
    Session rotated = sessionStore.findById(newCookie.getValue());
    assertThat((Long) rotated.getAttribute(ISSUED_SESSION_EPOCH)).isEqualTo(0L);
  }

  @Test
  void expiredSessionIsUnusableEvenWhenScheduledCleanupIsDisabled() {
    Session expired = sessionStore.createSession();
    expired.setAttribute(ACCOUNT_ID, SpikeFixtureRepository.ACTIVE_ACCOUNT.toString());
    expired.setAttribute(ISSUED_SESSION_EPOCH, 0L);
    expired.setLastAccessedTime(Instant.now().minusSeconds(60));
    expired.setMaxInactiveInterval(Duration.ofSeconds(1));
    sessionStore.save(expired);

    assertThat(count("SPRING_SESSION")).isOne();
    assertThat(sessionStore.findById(expired.getId())).isNull();
    assertThat(fixtures.find(SpikeFixtureRepository.ACTIVE_ACCOUNT).status()).isEqualTo("ACTIVE");
  }

  @Test
  void pendingSessionActionReconcilesAfterDeleteOutcomeFailure() throws Exception {
    Session session = sessionStore.createSession();
    sessionStore.save(session);
    UUID actionId = UUID.fromString("20000000-0000-0000-0000-000000000001");
    String idempotencyKey = "revoke-session-fixture-key";
    jdbc.update(
        """
                INSERT INTO SPIKE_SESSION_ACTION
                  (ACTION_ID, IDEMPOTENCY_KEY, SESSION_REF_HASH, ACTION_STATE, RESULT_VERSION)
                VALUES (?, ?, ?, 'PENDING', 0)
                """,
        actionId,
        idempotencyKey,
        sessionReferenceHash(session.getId()));
    jdbc.update(
        """
                INSERT INTO SPIKE_AUDIT_FIXTURE
                  (AUDIT_ID, ACTION_NAME, TARGET_REF, OUTCOME, CORRELATION_REF)
                VALUES (?, 'UNRELATED', ?, 'SUCCEEDED', ?)
                """,
        UUID.randomUUID(),
        SpikeFixtureRepository.ACTIVE_ACCOUNT,
        UUID.randomUUID());

    sessionStore.deleteById(session.getId());
    assertThatThrownBy(
            () ->
                transactions.executeWithoutResult(
                    ignored -> {
                      jdbc.update(
                          """
                                                    UPDATE SPIKE_SESSION_ACTION
                                                    SET ACTION_STATE='SUCCEEDED', RESULT_VERSION=1
                                                    WHERE IDEMPOTENCY_KEY=?
                                                    """,
                          idempotencyKey);
                      insertInvalidAudit();
                    }))
        .isInstanceOf(DataIntegrityViolationException.class);
    assertThat(actionState(idempotencyKey)).isEqualTo("PENDING");

    var reconcileStart = new CountDownLatch(1);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first =
          executor.submit(
              () -> {
                SpikeRaceControl.await(reconcileStart, Duration.ofSeconds(10));
                reconcileSessionAction(idempotencyKey, session.getId(), actionId);
              });
      var second =
          executor.submit(
              () -> {
                SpikeRaceControl.await(reconcileStart, Duration.ofSeconds(10));
                reconcileSessionAction(idempotencyKey, session.getId(), actionId);
              });
      reconcileStart.countDown();
      first.get(10, TimeUnit.SECONDS);
      second.get(10, TimeUnit.SECONDS);
    }
    reconcileSessionAction(idempotencyKey, session.getId(), actionId);

    assertThat(actionState(idempotencyKey)).isEqualTo("SUCCEEDED");
    assertThat(
            jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM SPIKE_AUDIT_FIXTURE
                        WHERE CORRELATION_REF=? AND ACTION_NAME='REVOKE_SESSION'
                        """,
                Integer.class,
                actionId))
        .isOne();
    assertThat(
            jdbc.queryForObject(
                "SELECT SESSION_REF_HASH FROM SPIKE_SESSION_ACTION WHERE ACTION_ID=?",
                String.class,
                actionId))
        .isEqualTo(sessionReferenceHash(session.getId()))
        .doesNotContain(session.getId());
    assertThat(sessionStore.findById(session.getId())).isNull();
  }

  @Test
  void anonymousLoginFailuresDoNotEnumerateAccountStateAndLogsContainNoSecrets() throws Exception {
    Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
    var appender = new ListAppender<ILoggingEvent>();
    appender.start();
    root.addAppender(appender);
    Level previous = root.getLevel();
    root.setLevel(Level.INFO);
    try {
      var cases = new LinkedHashMap<String, String>();
      cases.put("missing-user", FIXTURE_PASSWORD);
      cases.put("active-user", "wrong-fixture-password");
      cases.put("suspended-user", FIXTURE_PASSWORD);
      cases.put("closed-user", FIXTURE_PASSWORD);

      String expectedBody = null;
      String expectedContentType = null;
      long minimum = Long.MAX_VALUE;
      long maximum = Long.MIN_VALUE;
      for (var entry : cases.entrySet()) {
        long started = System.nanoTime();
        var result =
            mockMvc
                .perform(
                    post("/login")
                        .with(csrf())
                        .param("username", entry.getKey())
                        .param("password", entry.getValue()))
                .andReturn();
        long elapsed = System.nanoTime() - started;
        minimum = Math.min(minimum, elapsed);
        maximum = Math.max(maximum, elapsed);
        assertThat(result.getResponse().getStatus()).isEqualTo(401);
        if (expectedBody == null) {
          expectedBody = result.getResponse().getContentAsString();
          expectedContentType = result.getResponse().getContentType();
        }
        assertThat(result.getResponse().getContentAsString()).isEqualTo(expectedBody);
        assertThat(result.getResponse().getContentType()).isEqualTo(expectedContentType);
      }

      assertThat(authenticationProvider.internalReasons())
          .containsExactly("ACCOUNT_NOT_FOUND", "BAD_CREDENTIAL", "SUSPENDED", "ACCESS_CLOSED");
      assertThat(maximum).isGreaterThanOrEqualTo(minimum);

      String cookie = issueFixtureSession();
      String renderedLogs =
          appender.list.stream()
              .map(ILoggingEvent::getFormattedMessage)
              .reduce("", (left, right) -> left + "\n" + right);
      assertThat(renderedLogs)
          .doesNotContain(FIXTURE_PASSWORD)
          .doesNotContain("wrong-fixture-password")
          .doesNotContain(cookie)
          .doesNotContain("SPIKE_SESSION");
    } finally {
      root.setLevel(previous);
      root.detachAppender(appender);
      appender.stop();
    }
  }

  private boolean tableExists(String tableName) {
    return Boolean.TRUE.equals(
        jdbc.queryForObject(
            """
                        SELECT EXISTS (
                          SELECT 1 FROM information_schema.tables
                          WHERE table_schema='public' AND table_name=?
                        )
                        """,
            Boolean.class,
            tableName));
  }

  private int count(String tableName) {
    return Objects.requireNonNull(
        jdbc.queryForObject("SELECT COUNT(*) FROM " + tableName, Integer.class));
  }

  private void insertInvalidAudit() {
    jdbc.update(
        """
                INSERT INTO SPIKE_AUDIT_FIXTURE
                  (AUDIT_ID, ACTION_NAME, TARGET_REF, OUTCOME, CORRELATION_REF)
                VALUES (?, 'SUSPEND', ?, 'INVALID_OUTCOME', ?)
                """,
        UUID.randomUUID(),
        SpikeFixtureRepository.ACTIVE_ACCOUNT,
        UUID.randomUUID());
  }

  private void reconcileSessionAction(String key, String sessionId, UUID actionId) {
    if (sessionStore.findById(sessionId) != null || "SUCCEEDED".equals(actionState(key))) {
      return;
    }
    transactions.executeWithoutResult(
        ignored -> {
          jdbc.update(
              """
                            UPDATE SPIKE_SESSION_ACTION
                            SET ACTION_STATE='SUCCEEDED',
                                RESULT_VERSION=RESULT_VERSION+1,
                                UPDATED_AT=CURRENT_TIMESTAMP
                            WHERE IDEMPOTENCY_KEY=? AND ACTION_STATE='PENDING'
                            """,
              key);
          jdbc.update(
              """
                      INSERT INTO SPIKE_AUDIT_FIXTURE
                        (AUDIT_ID, ACTION_NAME, TARGET_REF, OUTCOME, CORRELATION_REF)
                      VALUES (?, 'REVOKE_SESSION', ?, 'SUCCEEDED', ?)
                      ON CONFLICT (CORRELATION_REF, ACTION_NAME, OUTCOME) DO NOTHING
                      """,
              UUID.randomUUID(),
              SpikeFixtureRepository.ACTIVE_ACCOUNT,
              actionId);
        });
  }

  private String sessionReferenceHash(String sessionId) {
    try {
      return java.util.HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(sessionId.getBytes(StandardCharsets.UTF_8)));
    } catch (java.security.NoSuchAlgorithmException exception) {
      throw new IllegalStateException("Required SHA-256 unavailable", exception);
    }
  }

  private String actionState(String key) {
    return jdbc.queryForObject(
        "SELECT ACTION_STATE FROM SPIKE_SESSION_ACTION WHERE IDEMPOTENCY_KEY=?", String.class, key);
  }

  private String issueFixtureSession() throws Exception {
    var response =
        http.send(
            request("/spike/login-fixture").GET().build(), HttpResponse.BodyHandlers.discarding());
    assertThat(response.statusCode()).isEqualTo(204);
    return sessionCookie(response);
  }

  private HttpResponse<Void> getWithCookie(String path, String cookie) throws Exception {
    return http.send(
        request(path).header("Cookie", cookieHeader(cookie)).GET().build(),
        HttpResponse.BodyHandlers.discarding());
  }

  private HttpRequest.Builder request(String path) {
    return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
        .timeout(Duration.ofSeconds(10));
  }

  private static String sessionCookie(HttpResponse<?> response) {
    return response.headers().allValues("Set-Cookie").stream()
        .flatMap(header -> HttpCookie.parse(header).stream())
        .filter(cookie -> cookie.getName().equals("SPIKE_SESSION"))
        .findFirst()
        .orElseThrow(() -> new AssertionError("Response did not issue the fixture session cookie"))
        .getValue();
  }

  private static String cookieHeader(String value) {
    return "SPIKE_SESSION=" + value;
  }

  @SuppressWarnings({"rawtypes", "unchecked"})
  private static SessionRepository<Session> asSessionStore(
      JdbcIndexedSessionRepository repository) {
    return (SessionRepository) repository;
  }
}

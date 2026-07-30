package metabus.social;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest
public abstract class PostgresIntegrationTestSupport {

  protected static final String POSTGRES_IMAGE = "postgres:18.4-alpine";

  protected static final PostgreSQLContainer POSTGRES =
      new PostgreSQLContainer(POSTGRES_IMAGE)
          .withDatabaseName("metabus_social_integration")
          .withUsername("metabus_test")
          .withPassword("test-only-not-a-secret");

  @Autowired protected JdbcTemplate jdbc;

  @DynamicPropertySource
  protected static void postgresProperties(DynamicPropertyRegistry registry) {
    if (!POSTGRES.isRunning()) {
      POSTGRES.start();
    }
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
  }

  @BeforeEach
  void cleanDomainTables() {
    jdbc.execute(
        """
        TRUNCATE TABLE
          audit_records,
          authorization_history,
          current_authorizations,
          account_credentials,
          account_login_identifiers,
          account_status_history,
          accounts
        CASCADE
        """);
  }
}

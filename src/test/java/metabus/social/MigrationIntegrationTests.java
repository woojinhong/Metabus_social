package metabus.social;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

class MigrationIntegrationTests extends PostgresIntegrationTestSupport {

  @Autowired private Flyway flyway;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private Environment environment;

  @Test
  void migratesCleanPostgresAndRecognizesAlreadyAppliedMigrations() {
    assertThat(flyway.info().applied()).hasSize(5);
    assertThat(flyway.validateWithResult().validationSuccessful).isTrue();
    assertThat(flyway.migrate().migrationsExecuted).isZero();

    assertThat(
            jdbc.queryForList(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """,
                String.class))
        .contains(
            "spring_session",
            "spring_session_attributes",
            "accounts",
            "account_status_history",
            "account_credentials",
            "current_authorizations",
            "authorization_history",
            "audit_records",
            "flyway_schema_history");
  }

  @Test
  void preservesTheExactSpringSession410PostgresSchema() {
    List<String> indexes =
        jdbc.queryForList(
            """
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public' AND tablename IN ('spring_session', 'spring_session_attributes')
            """,
            String.class);

    assertThat(indexes)
        .contains(
            "spring_session_pk",
            "spring_session_ix1",
            "spring_session_ix2",
            "spring_session_ix3",
            "spring_session_attributes_pk")
        .doesNotContain("spring_session_attributes_ix1");

    Integer accountForeignKeys =
        jdbc.queryForObject(
            """
            SELECT COUNT(*)
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
             AND tc.constraint_schema = ccu.constraint_schema
            WHERE tc.table_schema = 'public'
              AND tc.table_name IN ('spring_session', 'spring_session_attributes')
              AND ccu.table_name = 'accounts'
            """,
            Integer.class);

    assertThat(accountForeignKeys).isZero();
    assertThat(environment.getProperty("spring.session.jdbc.initialize-schema")).isEqualTo("never");
  }

  @Test
  void createsRequiredDomainConstraintsWithoutPlaintextPasswordColumns() {
    List<String> constraints =
        jdbc.queryForList(
            """
            SELECT conname
            FROM pg_constraint
            WHERE connamespace = 'public'::regnamespace
            """,
            String.class);

    assertThat(constraints)
        .contains(
            "accounts_session_epoch_ck",
            "accounts_authorization_epoch_ck",
            "accounts_status_ck",
            "accounts_version_ck",
            "account_status_history_transition_ck",
            "account_credentials_account_fk",
            "account_credentials_password_hash_ck",
            "current_authorizations_id_account_uk",
            "current_authorizations_status_ck",
            "authorization_history_authorization_account_fk",
            "authorization_history_transition_ck",
            "authorization_history_status_transition_ck",
            "authorization_history_version_uk",
            "audit_records_outcome_ck",
            "audit_records_idempotency_uk");

    String activeScopePredicate =
        jdbc.queryForObject(
            """
            SELECT pg_get_expr(index_definition.indpred, index_definition.indrelid)
            FROM pg_index index_definition
            JOIN pg_class indexed_table
              ON indexed_table.oid = index_definition.indrelid
            JOIN pg_class index_name
              ON index_name.oid = index_definition.indexrelid
            WHERE indexed_table.relname = 'current_authorizations'
              AND index_name.relname = 'current_authorizations_active_scope_uk'
            """,
            String.class);
    assertThat(activeScopePredicate).contains("status", "ACTIVE");

    List<String> credentialColumns =
        jdbc.queryForList(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'account_credentials'
            """,
            String.class);

    assertThat(credentialColumns)
        .contains("password_hash")
        .doesNotContain("password", "plain_password", "password_plaintext");

    List<String> auditColumns =
        jdbc.queryForList(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'audit_records'
            """,
            String.class);
    assertThat(auditColumns)
        .doesNotContain(
            "metadata", "session_id", "raw_session_id", "cookie", "password", "password_hash");
  }

  @Test
  void usesUuidPrimaryKeysRestrictiveForeignKeysAndTimestamptz() {
    List<String> primaryKeyTypes =
        jdbc.queryForList(
            """
            SELECT constraints.table_name || ':' || columns.data_type
            FROM information_schema.table_constraints constraints
            JOIN information_schema.key_column_usage keys
              ON keys.constraint_schema = constraints.constraint_schema
             AND keys.constraint_name = constraints.constraint_name
            JOIN information_schema.columns columns
              ON columns.table_schema = keys.table_schema
             AND columns.table_name = keys.table_name
             AND columns.column_name = keys.column_name
            WHERE constraints.table_schema = 'public'
              AND constraints.constraint_type = 'PRIMARY KEY'
              AND constraints.table_name IN (
                'accounts', 'account_status_history', 'account_credentials',
                'current_authorizations', 'authorization_history', 'audit_records'
              )
            """,
            String.class);
    assertThat(primaryKeyTypes)
        .containsExactlyInAnyOrder(
            "accounts:uuid",
            "account_status_history:uuid",
            "account_credentials:uuid",
            "current_authorizations:uuid",
            "authorization_history:uuid",
            "audit_records:uuid");

    List<String> nonRestrictiveForeignKeys =
        jdbc.queryForList(
            """
            SELECT constraint_definition.conname
            FROM pg_constraint constraint_definition
            JOIN pg_class owning_table ON owning_table.oid = constraint_definition.conrelid
            WHERE constraint_definition.contype = 'f'
              AND constraint_definition.confdeltype <> 'r'
              AND owning_table.relname IN (
                'account_status_history', 'account_credentials',
                'current_authorizations', 'authorization_history'
              )
            """,
            String.class);
    assertThat(nonRestrictiveForeignKeys).isEmpty();

    List<String> invalidTimestampTypes =
        jdbc.queryForList(
            """
            SELECT table_name || '.' || column_name || ':' || data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name IN (
                'accounts', 'account_status_history', 'account_credentials',
                'current_authorizations', 'authorization_history', 'audit_records'
              )
              AND (
                column_name LIKE '%_at'
                OR column_name IN ('valid_from', 'changed_at', 'occurred_at')
              )
              AND data_type <> 'timestamp with time zone'
            """,
            String.class);
    assertThat(invalidTimestampTypes).isEmpty();
  }
}

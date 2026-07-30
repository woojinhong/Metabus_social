package metabus.social;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

public final class PersistenceTestData {

  private PersistenceTestData() {}

  public static void insertActiveAccount(JdbcTemplate jdbc, UUID accountId, Instant now) {
    jdbc.update(
        """
        INSERT INTO accounts (
          id, status, session_epoch, authorization_epoch, version, created_at, updated_at
        ) VALUES (?, 'ACTIVE', 0, 0, 0, ?, ?)
        """,
        accountId,
        Timestamp.from(now),
        Timestamp.from(now));
  }
}

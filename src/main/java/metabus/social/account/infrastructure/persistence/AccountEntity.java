package metabus.social.account.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import metabus.social.account.domain.AccountStatus;

@Entity
@Table(name = "accounts")
class AccountEntity {

  @Id private UUID id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private AccountStatus status;

  @Column(name = "session_epoch", nullable = false)
  private long sessionEpoch;

  @Column(name = "authorization_epoch", nullable = false)
  private long authorizationEpoch;

  @Version
  @Column(nullable = false)
  private long version;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected AccountEntity() {}

  AccountEntity(
      UUID id,
      AccountStatus status,
      long sessionEpoch,
      long authorizationEpoch,
      Instant createdAt,
      Instant updatedAt) {
    this.id = id;
    this.status = status;
    this.sessionEpoch = sessionEpoch;
    this.authorizationEpoch = authorizationEpoch;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  UUID getId() {
    return id;
  }

  AccountStatus getStatus() {
    return status;
  }

  long getSessionEpoch() {
    return sessionEpoch;
  }

  long getAuthorizationEpoch() {
    return authorizationEpoch;
  }

  long getVersion() {
    return version;
  }

  Instant getCreatedAt() {
    return createdAt;
  }

  Instant getUpdatedAt() {
    return updatedAt;
  }
}

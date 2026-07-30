package metabus.social.account.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import metabus.social.account.domain.AccountStatus;

@Entity
@Table(name = "account_status_history")
class AccountStatusHistoryEntity {

  @Id private UUID id;

  @Column(name = "account_id", nullable = false)
  private UUID accountId;

  @Enumerated(EnumType.STRING)
  @Column(name = "from_status", length = 32)
  private AccountStatus fromStatus;

  @Enumerated(EnumType.STRING)
  @Column(name = "to_status", nullable = false, length = 32)
  private AccountStatus toStatus;

  @Column(name = "account_version", nullable = false)
  private long accountVersion;

  @Column(name = "actor_reference")
  private UUID actorReference;

  @Column(name = "reason_code", length = 64)
  private String reasonCode;

  @Column(name = "correlation_id", nullable = false)
  private UUID correlationId;

  @Column(name = "changed_at", nullable = false)
  private Instant changedAt;

  protected AccountStatusHistoryEntity() {}

  AccountStatusHistoryEntity(
      UUID id,
      UUID accountId,
      AccountStatus fromStatus,
      AccountStatus toStatus,
      long accountVersion,
      UUID actorReference,
      String reasonCode,
      UUID correlationId,
      Instant changedAt) {
    this.id = id;
    this.accountId = accountId;
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
    this.accountVersion = accountVersion;
    this.actorReference = actorReference;
    this.reasonCode = reasonCode;
    this.correlationId = correlationId;
    this.changedAt = changedAt;
  }
}

package metabus.social.authorization.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import metabus.social.authorization.domain.AuthorizationStatus;
import metabus.social.authorization.domain.AuthorizationTransition;

@Entity
@Table(name = "authorization_history")
class AuthorizationHistoryEntity {

  @Id private UUID id;

  @Column(name = "authorization_id", nullable = false)
  private UUID authorizationId;

  @Column(name = "account_id", nullable = false)
  private UUID accountId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private AuthorizationTransition transition;

  @Enumerated(EnumType.STRING)
  @Column(name = "from_status", length = 32)
  private AuthorizationStatus fromStatus;

  @Enumerated(EnumType.STRING)
  @Column(name = "to_status", nullable = false, length = 32)
  private AuthorizationStatus toStatus;

  @Column(name = "authorization_version", nullable = false)
  private long authorizationVersion;

  @Column(name = "actor_reference")
  private UUID actorReference;

  @Column(name = "correlation_id", nullable = false)
  private UUID correlationId;

  @Column(name = "changed_at", nullable = false)
  private Instant changedAt;

  protected AuthorizationHistoryEntity() {}

  AuthorizationHistoryEntity(
      UUID id,
      UUID authorizationId,
      UUID accountId,
      AuthorizationTransition transition,
      AuthorizationStatus fromStatus,
      AuthorizationStatus toStatus,
      long authorizationVersion,
      UUID actorReference,
      UUID correlationId,
      Instant changedAt) {
    this.id = id;
    this.authorizationId = authorizationId;
    this.accountId = accountId;
    this.transition = transition;
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
    this.authorizationVersion = authorizationVersion;
    this.actorReference = actorReference;
    this.correlationId = correlationId;
    this.changedAt = changedAt;
  }

  UUID getAuthorizationId() {
    return authorizationId;
  }

  AuthorizationTransition getTransition() {
    return transition;
  }
}

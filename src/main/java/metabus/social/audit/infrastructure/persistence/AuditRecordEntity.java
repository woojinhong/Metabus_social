package metabus.social.audit.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import metabus.social.audit.domain.AuditOutcome;

@Entity
@Table(name = "audit_records")
class AuditRecordEntity {

  @Id private UUID id;

  @Column(name = "occurred_at", nullable = false)
  private Instant occurredAt;

  @Column(name = "actor_type", nullable = false, length = 32)
  private String actorType;

  @Column(name = "actor_reference")
  private UUID actorReference;

  @Column(name = "target_type", nullable = false, length = 64)
  private String targetType;

  @Column(name = "target_reference")
  private UUID targetReference;

  @Column(nullable = false, length = 100)
  private String action;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private AuditOutcome outcome;

  @Column(name = "correlation_id", nullable = false)
  private UUID correlationId;

  @Column(name = "idempotency_key", nullable = false)
  private UUID idempotencyKey;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected AuditRecordEntity() {}

  AuditRecordEntity(
      UUID id,
      Instant occurredAt,
      String actorType,
      UUID actorReference,
      String targetType,
      UUID targetReference,
      String action,
      AuditOutcome outcome,
      UUID correlationId,
      UUID idempotencyKey,
      Instant createdAt) {
    this.id = id;
    this.occurredAt = occurredAt;
    this.actorType = actorType;
    this.actorReference = actorReference;
    this.targetType = targetType;
    this.targetReference = targetReference;
    this.action = action;
    this.outcome = outcome;
    this.correlationId = correlationId;
    this.idempotencyKey = idempotencyKey;
    this.createdAt = createdAt;
  }

  UUID getId() {
    return id;
  }

  String getAction() {
    return action;
  }

  AuditOutcome getOutcome() {
    return outcome;
  }
}

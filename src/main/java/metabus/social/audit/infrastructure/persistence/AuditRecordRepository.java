package metabus.social.audit.infrastructure.persistence;

import jakarta.persistence.EntityManager;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
class AuditRecordRepository {

  private final EntityManager entityManager;

  AuditRecordRepository(EntityManager entityManager) {
    this.entityManager = entityManager;
  }

  @Transactional
  AuditRecordEntity insert(AuditRecordEntity record) {
    entityManager.persist(record);
    entityManager.flush();
    return record;
  }

  @Transactional(readOnly = true)
  Optional<AuditRecordEntity> findByCorrelationIdAndIdempotencyKey(
      UUID correlationId, UUID idempotencyKey) {
    return entityManager
        .createQuery(
            """
            SELECT record
            FROM AuditRecordEntity record
            WHERE record.correlationId = :correlationId
              AND record.idempotencyKey = :idempotencyKey
            """,
            AuditRecordEntity.class)
        .setParameter("correlationId", correlationId)
        .setParameter("idempotencyKey", idempotencyKey)
        .getResultStream()
        .findFirst();
  }
}

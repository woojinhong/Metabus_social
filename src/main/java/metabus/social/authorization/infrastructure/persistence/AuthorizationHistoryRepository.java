package metabus.social.authorization.infrastructure.persistence;

import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
class AuthorizationHistoryRepository {

  private final EntityManager entityManager;

  AuthorizationHistoryRepository(EntityManager entityManager) {
    this.entityManager = entityManager;
  }

  @Transactional
  AuthorizationHistoryEntity insert(AuthorizationHistoryEntity history) {
    entityManager.persist(history);
    entityManager.flush();
    return history;
  }

  @Transactional(readOnly = true)
  List<AuthorizationHistoryEntity> findByAuthorizationIdOrderByChangedAtAsc(UUID authorizationId) {
    return entityManager
        .createQuery(
            """
            SELECT history
            FROM AuthorizationHistoryEntity history
            WHERE history.authorizationId = :authorizationId
            ORDER BY history.changedAt
            """,
            AuthorizationHistoryEntity.class)
        .setParameter("authorizationId", authorizationId)
        .getResultList();
  }
}

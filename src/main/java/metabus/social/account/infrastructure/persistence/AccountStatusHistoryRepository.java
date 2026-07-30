package metabus.social.account.infrastructure.persistence;

import jakarta.persistence.EntityManager;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@ConditionalOnProperty("spring.datasource.url")
class AccountStatusHistoryRepository {

  private final EntityManager entityManager;

  AccountStatusHistoryRepository(EntityManager entityManager) {
    this.entityManager = entityManager;
  }

  @Transactional
  AccountStatusHistoryEntity insert(AccountStatusHistoryEntity history) {
    entityManager.persist(history);
    entityManager.flush();
    return history;
  }

  @Transactional(readOnly = true)
  long count() {
    return entityManager
        .createQuery("SELECT COUNT(history) FROM AccountStatusHistoryEntity history", Long.class)
        .getSingleResult();
  }
}

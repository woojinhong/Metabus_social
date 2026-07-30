package metabus.social.account.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

interface AccountRepository extends Repository<AccountEntity, UUID> {

  AccountEntity saveAndFlush(AccountEntity account);

  Optional<AccountEntity> findById(UUID accountId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select account from AccountEntity account where account.id = :accountId")
  Optional<AccountEntity> findByIdForUpdate(@Param("accountId") UUID accountId);
}

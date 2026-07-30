package metabus.social.account.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import metabus.social.account.domain.AccountLoginIdentifierType;
import org.springframework.data.repository.Repository;

interface AccountLoginIdentifierRepository extends Repository<AccountLoginIdentifierEntity, UUID> {

  AccountLoginIdentifierEntity saveAndFlush(AccountLoginIdentifierEntity identifier);

  Optional<AccountLoginIdentifierEntity> findByNormalizedEmailAndRevokedAtIsNull(
      String normalizedEmail);

  Optional<AccountLoginIdentifierEntity> findByAccountIdAndIdentifierTypeAndRevokedAtIsNull(
      UUID accountId, AccountLoginIdentifierType identifierType);
}

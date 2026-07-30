package metabus.social.authentication.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import metabus.social.authentication.domain.CredentialType;
import org.springframework.data.repository.Repository;

interface CredentialRepository extends Repository<CredentialEntity, UUID> {

  CredentialEntity saveAndFlush(CredentialEntity credential);

  Optional<CredentialEntity> findByAccountIdAndCredentialTypeAndRevokedAtIsNull(
      UUID accountId, CredentialType credentialType);
}

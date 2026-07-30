package metabus.social.authorization.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

interface CurrentAuthorizationRepository extends Repository<CurrentAuthorizationEntity, UUID> {

  CurrentAuthorizationEntity saveAndFlush(CurrentAuthorizationEntity authorization);

  @Query(
      """
      SELECT authorization
      FROM CurrentAuthorizationEntity authorization
      WHERE authorization.accountId = :accountId
        AND authorization.status =
          metabus.social.authorization.domain.AuthorizationStatus.ACTIVE
        AND authorization.validFrom <= :now
        AND (authorization.expiresAt IS NULL OR authorization.expiresAt > :now)
      """)
  List<CurrentAuthorizationEntity> findEffectiveByAccountId(
      @Param("accountId") UUID accountId, @Param("now") Instant now);
}

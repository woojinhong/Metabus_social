package metabus.social.authorization.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import metabus.social.authorization.domain.AuthorizationStatus;

@Entity
@Table(name = "current_authorizations")
class CurrentAuthorizationEntity {

  @Id private UUID id;

  @Column(name = "account_id", nullable = false)
  private UUID accountId;

  @Column(nullable = false, length = 100)
  private String authority;

  @Column(name = "scope_type", nullable = false, length = 64)
  private String scopeType;

  @Column(name = "scope_reference", length = 128)
  private String scopeReference;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private AuthorizationStatus status;

  @Column(name = "valid_from", nullable = false)
  private Instant validFrom;

  @Column(name = "expires_at")
  private Instant expiresAt;

  @Version
  @Column(nullable = false)
  private long version;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected CurrentAuthorizationEntity() {}

  CurrentAuthorizationEntity(
      UUID id,
      UUID accountId,
      String authority,
      String scopeType,
      String scopeReference,
      AuthorizationStatus status,
      Instant validFrom,
      Instant expiresAt,
      Instant createdAt,
      Instant updatedAt) {
    this.id = id;
    this.accountId = accountId;
    this.authority = authority;
    this.scopeType = scopeType;
    this.scopeReference = scopeReference;
    this.status = status;
    this.validFrom = validFrom;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  UUID getId() {
    return id;
  }

  UUID getAccountId() {
    return accountId;
  }

  String getAuthority() {
    return authority;
  }

  String getScopeType() {
    return scopeType;
  }

  String getScopeReference() {
    return scopeReference;
  }

  AuthorizationStatus getStatus() {
    return status;
  }

  long getVersion() {
    return version;
  }
}

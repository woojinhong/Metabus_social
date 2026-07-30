package metabus.social.authentication.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import metabus.social.authentication.domain.CredentialType;

@Entity
@Table(name = "account_credentials")
class CredentialEntity {

  @Id private UUID id;

  @Column(name = "account_id", nullable = false)
  private UUID accountId;

  @Enumerated(EnumType.STRING)
  @Column(name = "credential_type", nullable = false, length = 32)
  private CredentialType credentialType;

  @Column(name = "password_hash", nullable = false, length = 512)
  private String passwordHash;

  @Version
  @Column(nullable = false)
  private long version;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  protected CredentialEntity() {}

  CredentialEntity(
      UUID id,
      UUID accountId,
      CredentialType credentialType,
      String passwordHash,
      Instant createdAt,
      Instant updatedAt,
      Instant revokedAt) {
    this.id = id;
    this.accountId = accountId;
    this.credentialType = credentialType;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.revokedAt = revokedAt;
  }

  UUID getId() {
    return id;
  }

  UUID getAccountId() {
    return accountId;
  }

  CredentialType getCredentialType() {
    return credentialType;
  }

  String getPasswordHash() {
    return passwordHash;
  }

  long getVersion() {
    return version;
  }

  Instant getRevokedAt() {
    return revokedAt;
  }
}

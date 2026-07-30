package metabus.social.account.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import metabus.social.account.domain.AccountLoginIdentifierType;

@Entity
@Table(name = "account_login_identifiers")
class AccountLoginIdentifierEntity {

  @Id private UUID id;

  @Column(name = "account_id", nullable = false)
  private UUID accountId;

  @Enumerated(EnumType.STRING)
  @Column(name = "identifier_type", nullable = false, length = 32)
  private AccountLoginIdentifierType identifierType;

  @Column(name = "normalized_email", nullable = false, length = 320)
  private String normalizedEmail;

  @Column(name = "verified_at", nullable = false)
  private Instant verifiedAt;

  @Version
  @Column(nullable = false)
  private long version;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  protected AccountLoginIdentifierEntity() {}

  AccountLoginIdentifierEntity(
      UUID id,
      UUID accountId,
      AccountLoginIdentifierType identifierType,
      String normalizedEmail,
      Instant verifiedAt,
      Instant createdAt,
      Instant updatedAt,
      Instant revokedAt) {
    this.id = id;
    this.accountId = accountId;
    this.identifierType = identifierType;
    this.normalizedEmail = normalizedEmail;
    this.verifiedAt = verifiedAt;
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

  AccountLoginIdentifierType getIdentifierType() {
    return identifierType;
  }

  String getNormalizedEmail() {
    return normalizedEmail;
  }

  Instant getVerifiedAt() {
    return verifiedAt;
  }

  long getVersion() {
    return version;
  }

  Instant getRevokedAt() {
    return revokedAt;
  }
}

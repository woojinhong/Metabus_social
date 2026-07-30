CREATE TABLE account_login_identifiers (
  id UUID NOT NULL,
  account_id UUID NOT NULL,
  identifier_type VARCHAR(32) NOT NULL,
  normalized_email VARCHAR(320) COLLATE "C" NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT account_login_identifiers_pk PRIMARY KEY (id),
  CONSTRAINT account_login_identifiers_account_fk
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  CONSTRAINT account_login_identifiers_type_ck CHECK (identifier_type = 'EMAIL'),
  CONSTRAINT account_login_identifiers_email_ck
    CHECK (
      normalized_email = BTRIM(normalized_email)
      AND POSITION('@' IN normalized_email) > 1
      AND POSITION('@' IN normalized_email) < CHAR_LENGTH(normalized_email)
    ),
  CONSTRAINT account_login_identifiers_version_ck CHECK (version >= 0),
  CONSTRAINT account_login_identifiers_timestamps_ck
    CHECK (
      updated_at >= created_at
      AND verified_at <= created_at
      AND (
        revoked_at IS NULL
        OR (revoked_at >= created_at AND revoked_at <= updated_at)
      )
    )
);

CREATE UNIQUE INDEX account_login_identifiers_active_email_uk
  ON account_login_identifiers (identifier_type, normalized_email)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX account_login_identifiers_active_account_type_uk
  ON account_login_identifiers (account_id, identifier_type)
  WHERE revoked_at IS NULL;

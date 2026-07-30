CREATE TABLE account_credentials (
  id UUID NOT NULL,
  account_id UUID NOT NULL,
  credential_type VARCHAR(32) NOT NULL,
  password_hash VARCHAR(512) NOT NULL,
  version BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT account_credentials_pk PRIMARY KEY (id),
  CONSTRAINT account_credentials_account_fk
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  CONSTRAINT account_credentials_type_ck CHECK (credential_type = 'PASSWORD'),
  CONSTRAINT account_credentials_password_hash_ck CHECK (BTRIM(password_hash) <> ''),
  CONSTRAINT account_credentials_version_ck CHECK (version >= 0),
  CONSTRAINT account_credentials_timestamps_ck
    CHECK (updated_at >= created_at AND (revoked_at IS NULL OR revoked_at >= created_at))
);

CREATE UNIQUE INDEX account_credentials_active_type_uk
  ON account_credentials (account_id, credential_type)
  WHERE revoked_at IS NULL;

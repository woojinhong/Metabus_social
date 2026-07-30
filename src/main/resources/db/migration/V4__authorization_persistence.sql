CREATE TABLE current_authorizations (
  id UUID NOT NULL,
  account_id UUID NOT NULL,
  authority VARCHAR(100) NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_reference VARCHAR(128),
  status VARCHAR(32) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  version BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT current_authorizations_pk PRIMARY KEY (id),
  CONSTRAINT current_authorizations_id_account_uk UNIQUE (id, account_id),
  CONSTRAINT current_authorizations_account_fk
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  CONSTRAINT current_authorizations_authority_ck CHECK (BTRIM(authority) <> ''),
  CONSTRAINT current_authorizations_scope_type_ck CHECK (BTRIM(scope_type) <> ''),
  CONSTRAINT current_authorizations_status_ck
    CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  CONSTRAINT current_authorizations_lifetime_ck
    CHECK (expires_at IS NULL OR expires_at > valid_from),
  CONSTRAINT current_authorizations_version_ck CHECK (version >= 0),
  CONSTRAINT current_authorizations_timestamps_ck CHECK (updated_at >= created_at)
);

CREATE UNIQUE INDEX current_authorizations_active_scope_uk
  ON current_authorizations (account_id, authority, scope_type, scope_reference)
  NULLS NOT DISTINCT
  WHERE status = 'ACTIVE';

CREATE INDEX current_authorizations_account_status_ix
  ON current_authorizations (account_id, status);

CREATE TABLE authorization_history (
  id UUID NOT NULL,
  authorization_id UUID NOT NULL,
  account_id UUID NOT NULL,
  transition VARCHAR(32) NOT NULL,
  from_status VARCHAR(32),
  to_status VARCHAR(32) NOT NULL,
  authorization_version BIGINT NOT NULL,
  actor_reference UUID,
  correlation_id UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT authorization_history_pk PRIMARY KEY (id),
  CONSTRAINT authorization_history_authorization_account_fk
    FOREIGN KEY (authorization_id, account_id)
      REFERENCES current_authorizations(id, account_id) ON DELETE RESTRICT,
  CONSTRAINT authorization_history_account_fk
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  CONSTRAINT authorization_history_transition_ck
    CHECK (transition IN ('GRANTED', 'REVOKED', 'EXPIRED')),
  CONSTRAINT authorization_history_from_status_ck
    CHECK (from_status IS NULL OR from_status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  CONSTRAINT authorization_history_to_status_ck
    CHECK (to_status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  CONSTRAINT authorization_history_status_transition_ck
    CHECK (
      (transition = 'GRANTED' AND from_status IS NULL AND to_status = 'ACTIVE')
      OR (
        transition = 'REVOKED'
        AND from_status = 'ACTIVE'
        AND to_status = 'REVOKED'
      )
      OR (
        transition = 'EXPIRED'
        AND from_status = 'ACTIVE'
        AND to_status = 'EXPIRED'
      )
    ),
  CONSTRAINT authorization_history_version_ck CHECK (authorization_version >= 0),
  CONSTRAINT authorization_history_version_uk
    UNIQUE (authorization_id, authorization_version)
);

CREATE INDEX authorization_history_account_time_ix
  ON authorization_history (account_id, changed_at DESC);

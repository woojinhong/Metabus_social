CREATE TABLE accounts (
  id UUID NOT NULL,
  status VARCHAR(32) NOT NULL,
  session_epoch BIGINT NOT NULL,
  authorization_epoch BIGINT NOT NULL,
  version BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT accounts_pk PRIMARY KEY (id),
  CONSTRAINT accounts_status_ck
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ACCESS_CLOSED')),
  CONSTRAINT accounts_session_epoch_ck CHECK (session_epoch >= 0),
  CONSTRAINT accounts_authorization_epoch_ck CHECK (authorization_epoch >= 0),
  CONSTRAINT accounts_version_ck CHECK (version >= 0),
  CONSTRAINT accounts_timestamps_ck CHECK (updated_at >= created_at)
);

CREATE TABLE account_status_history (
  id UUID NOT NULL,
  account_id UUID NOT NULL,
  from_status VARCHAR(32),
  to_status VARCHAR(32) NOT NULL,
  account_version BIGINT NOT NULL,
  actor_reference UUID,
  reason_code VARCHAR(64),
  correlation_id UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT account_status_history_pk PRIMARY KEY (id),
  CONSTRAINT account_status_history_account_fk
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  CONSTRAINT account_status_history_from_status_ck
    CHECK (from_status IS NULL OR from_status IN ('ACTIVE', 'SUSPENDED', 'ACCESS_CLOSED')),
  CONSTRAINT account_status_history_to_status_ck
    CHECK (to_status IN ('ACTIVE', 'SUSPENDED', 'ACCESS_CLOSED')),
  CONSTRAINT account_status_history_transition_ck
    CHECK (
      (from_status IS NULL AND to_status = 'ACTIVE')
      OR (from_status = 'ACTIVE' AND to_status IN ('SUSPENDED', 'ACCESS_CLOSED'))
      OR (from_status = 'SUSPENDED' AND to_status IN ('ACTIVE', 'ACCESS_CLOSED'))
    ),
  CONSTRAINT account_status_history_version_ck CHECK (account_version >= 0),
  CONSTRAINT account_status_history_version_uk UNIQUE (account_id, account_version)
);

CREATE INDEX account_status_history_account_time_ix
  ON account_status_history (account_id, changed_at DESC);

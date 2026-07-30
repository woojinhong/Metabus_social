CREATE TABLE audit_records (
  id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_type VARCHAR(32) NOT NULL,
  actor_reference UUID,
  target_type VARCHAR(64) NOT NULL,
  target_reference UUID,
  action VARCHAR(100) NOT NULL,
  outcome VARCHAR(32) NOT NULL,
  correlation_id UUID NOT NULL,
  idempotency_key UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT audit_records_pk PRIMARY KEY (id),
  CONSTRAINT audit_records_actor_type_ck CHECK (BTRIM(actor_type) <> ''),
  CONSTRAINT audit_records_target_type_ck CHECK (BTRIM(target_type) <> ''),
  CONSTRAINT audit_records_action_ck CHECK (BTRIM(action) <> ''),
  CONSTRAINT audit_records_outcome_ck CHECK (outcome IN ('SUCCESS', 'FAILURE')),
  CONSTRAINT audit_records_idempotency_uk UNIQUE (correlation_id, idempotency_key)
);

CREATE INDEX audit_records_target_time_ix
  ON audit_records (target_type, target_reference, occurred_at DESC);

CREATE INDEX audit_records_action_time_ix
  ON audit_records (action, occurred_at DESC);

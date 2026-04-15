CREATE TABLE IF NOT EXISTS pairing_history (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a     INTEGER     NOT NULL REFERENCES users(id),
  user_b     INTEGER     NOT NULL REFERENCES users(id),
  project_id UUID        NOT NULL REFERENCES projects(id),
  paired_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_a < user_b)
);

CREATE INDEX IF NOT EXISTS idx_pairing_history_user_a ON pairing_history (user_a);
CREATE INDEX IF NOT EXISTS idx_pairing_history_user_b ON pairing_history (user_b);

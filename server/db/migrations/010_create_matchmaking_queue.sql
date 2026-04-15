CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  project_id     UUID        NOT NULL REFERENCES projects(id),
  mode           VARCHAR(10) NOT NULL CHECK (mode IN ('duo', 'team')),
  role_id        INTEGER     REFERENCES roles(id),
  experience_level INTEGER   NOT NULL DEFAULT 1 CHECK (experience_level IN (1, 2, 3)),
  queued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_mode ON matchmaking_queue (mode);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_project ON matchmaking_queue (project_id);

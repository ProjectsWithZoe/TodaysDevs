CREATE TABLE IF NOT EXISTS teams (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID         NOT NULL REFERENCES projects(id),
  -- users.id is SERIAL (INTEGER) — spec note says uuid but existing schema is INTEGER
  created_by  INTEGER      NOT NULL REFERENCES users(id),
  mode        VARCHAR(10)  NOT NULL CHECK (mode IN ('solo', 'duo', 'team')),
  status      VARCHAR(20)  NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'completed')),
  join_code   VARCHAR(10)  NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_project_id ON teams (project_id);
CREATE INDEX IF NOT EXISTS idx_teams_join_code  ON teams (join_code);

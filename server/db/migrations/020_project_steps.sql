CREATE TABLE IF NOT EXISTS project_steps (
  id          UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step        INTEGER NOT NULL,
  role        TEXT,                  -- null = all roles, otherwise 'frontend'|'backend'|'fullstack'
  title       TEXT    NOT NULL,
  body        TEXT    NOT NULL,
  UNIQUE (project_id, step)
);

CREATE INDEX IF NOT EXISTS idx_project_steps_project_id ON project_steps (project_id, step);

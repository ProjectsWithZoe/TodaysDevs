CREATE TABLE IF NOT EXISTS project_resources (
  id         UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_id    INTEGER       REFERENCES roles(id) ON DELETE SET NULL,  -- NULL = shown to all roles
  label      VARCHAR(255)  NOT NULL,
  url        VARCHAR(2048) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON project_resources (project_id);

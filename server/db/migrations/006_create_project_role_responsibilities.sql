CREATE TABLE IF NOT EXISTS project_role_responsibilities (
  id               UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_id          INTEGER NOT NULL REFERENCES roles(id)    ON DELETE CASCADE,
  responsibilities TEXT[]  NOT NULL DEFAULT '{}',
  UNIQUE (project_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_prr_project_id ON project_role_responsibilities (project_id);
CREATE INDEX IF NOT EXISTS idx_prr_role_id    ON project_role_responsibilities (role_id);

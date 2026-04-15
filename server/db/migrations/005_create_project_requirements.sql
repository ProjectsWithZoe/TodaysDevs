DO $$ BEGIN
  CREATE TYPE requirement_type AS ENUM ('functional', 'non-functional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS project_requirements (
  id          UUID             NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID             NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type        requirement_type NOT NULL,
  body        TEXT             NOT NULL,
  sort_order  INTEGER          NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_project_requirements_project_id ON project_requirements (project_id);

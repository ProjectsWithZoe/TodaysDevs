-- Safe enum creation (PostgreSQL has no CREATE TYPE IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE project_difficulty AS ENUM ('junior', 'mid', 'senior');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_type AS ENUM ('solo', 'duo', 'team');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS projects (
  id                UUID               NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title             VARCHAR(255)       NOT NULL,
  description       TEXT,
  difficulty        project_difficulty NOT NULL,
  type              project_type       NOT NULL,
  -- Set at insert time: junior=1, mid=2, senior=3 (used in Section 7 scoring)
  difficulty_weight INTEGER            NOT NULL CHECK (difficulty_weight BETWEEN 1 AND 3),
  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

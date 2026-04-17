-- Projects are now sourced from GitHub, not the DB.
-- Drop FK constraints so project_id columns can hold GitHub folder slugs (TEXT).

-- teams
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_project_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'project_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE teams ALTER COLUMN project_id TYPE TEXT;
  END IF;
END $$;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS project_title TEXT;

-- submissions
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_project_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'project_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE submissions ALTER COLUMN project_id TYPE TEXT;
  END IF;
END $$;

-- matchmaking_queue
ALTER TABLE matchmaking_queue DROP CONSTRAINT IF EXISTS matchmaking_queue_project_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matchmaking_queue' AND column_name = 'project_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE matchmaking_queue ALTER COLUMN project_id TYPE TEXT;
  END IF;
END $$;

-- pairing_history
ALTER TABLE pairing_history DROP CONSTRAINT IF EXISTS pairing_history_project_id_fkey;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pairing_history' AND column_name = 'project_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE pairing_history ALTER COLUMN project_id TYPE TEXT;
  END IF;
END $$;

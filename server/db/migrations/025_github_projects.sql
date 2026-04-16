-- Projects are now sourced from GitHub, not the DB.
-- Drop FK constraints so project_id columns can hold GitHub folder slugs (TEXT).

-- teams
ALTER TABLE teams DROP CONSTRAINT teams_project_id_fkey;
ALTER TABLE teams ALTER COLUMN project_id TYPE TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS project_title TEXT;

-- submissions
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_project_id_fkey;
ALTER TABLE submissions ALTER COLUMN project_id TYPE TEXT;

-- matchmaking_queue (unused, but keep schema consistent)
ALTER TABLE matchmaking_queue DROP CONSTRAINT IF EXISTS matchmaking_queue_project_id_fkey;
ALTER TABLE matchmaking_queue ALTER COLUMN project_id TYPE TEXT;

-- pairing_history (unused, but keep schema consistent)
ALTER TABLE pairing_history DROP CONSTRAINT IF EXISTS pairing_history_project_id_fkey;
ALTER TABLE pairing_history ALTER COLUMN project_id TYPE TEXT;

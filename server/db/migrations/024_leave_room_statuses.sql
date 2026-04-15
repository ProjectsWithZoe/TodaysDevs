-- Extends teams.status to support leave-room flows, and adds tracking columns.

ALTER TABLE teams
  DROP CONSTRAINT IF EXISTS teams_status_check,
  ADD CONSTRAINT teams_status_check
    CHECK (status IN (
      'lobby', 'active', 'completed',
      'partner_left', 'seeking_replacement', 'dissolved'
    )),
  ADD COLUMN IF NOT EXISTS partner_left_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seeking_role    VARCHAR(20);

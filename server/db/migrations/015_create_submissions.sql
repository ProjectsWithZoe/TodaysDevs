CREATE TABLE IF NOT EXISTS submissions (
  id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id        UUID         NOT NULL REFERENCES teams(id) UNIQUE,
  project_id     UUID         NOT NULL REFERENCES projects(id),
  submitted_by   INTEGER      NOT NULL REFERENCES users(id),
  repo_url       VARCHAR(500) NOT NULL,
  notes          TEXT,
  status         VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  submitted_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ,
  reviewed_by    INTEGER      REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_user   ON submissions (submitted_by);

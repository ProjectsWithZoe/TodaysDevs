CREATE TABLE IF NOT EXISTS leaderboard_scores (
  id                 UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  score              INTEGER     NOT NULL DEFAULT 0,
  solo_score         INTEGER     NOT NULL DEFAULT 0,
  duo_score          INTEGER     NOT NULL DEFAULT 0,
  team_score         INTEGER     NOT NULL DEFAULT 0,
  projects_completed INTEGER     NOT NULL DEFAULT 0,
  streak_days        INTEGER     NOT NULL DEFAULT 0,
  last_active        DATE        NOT NULL DEFAULT CURRENT_DATE,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score  ON leaderboard_scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_streak ON leaderboard_scores (streak_days DESC);

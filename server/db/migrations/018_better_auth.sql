-- Better Auth schema migration
-- Extends the existing users table and adds BA session/account/verification tables

-- ── 1. Extend users ──────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── 2. Sessions (replaces refresh_tokens for BA-managed sessions) ─────────────
CREATE TABLE IF NOT EXISTS ba_sessions (
  id          TEXT        PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ba_sessions_token   ON ba_sessions (token);
CREATE INDEX IF NOT EXISTS idx_ba_sessions_user_id ON ba_sessions (user_id);

-- ── 3. Accounts (credential + future OAuth providers) ────────────────────────
CREATE TABLE IF NOT EXISTS ba_accounts (
  id              TEXT PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id      TEXT    NOT NULL,
  provider_id     TEXT    NOT NULL,
  access_token    TEXT,
  refresh_token   TEXT,
  id_token        TEXT,
  expires_at      TIMESTAMPTZ,
  password        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ba_accounts_user ON ba_accounts (user_id);

-- ── 4. Verification tokens ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ba_verification (
  id          TEXT PRIMARY KEY,
  identifier  TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Migrate existing bcrypt password hashes into ba_accounts ───────────────
-- This lets existing users log in immediately via Better Auth.
-- password_hash is preserved in users table for reference during transition.
INSERT INTO ba_accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
SELECT
  'legacy_' || id::text,
  id,
  email,
  'credential',
  password_hash,
  created_at,
  NOW()
FROM users
ON CONFLICT (id) DO NOTHING;

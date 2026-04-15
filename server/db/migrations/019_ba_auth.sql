-- Better Auth tables (v2) — TEXT user IDs, snake_case columns
-- Separate from the existing `users` table; bridge is done at the app layer via email.

-- ── 1. Make password_hash nullable (auth is now BA's responsibility) ──────────
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- ── 2. auth_user — BA's canonical user record ────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_user (
  id             TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  email_verified BOOLEAN     NOT NULL DEFAULT false,
  image          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. auth_session ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_session (
  id          TEXT        PRIMARY KEY,
  user_id     TEXT        NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_session_token   ON auth_session (token);
CREATE INDEX IF NOT EXISTS idx_auth_session_user_id ON auth_session (user_id);

-- ── 4. auth_account ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_account (
  id            TEXT PRIMARY KEY,
  user_id       TEXT        NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  account_id    TEXT        NOT NULL,
  provider_id   TEXT        NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  id_token      TEXT,
  expires_at    TIMESTAMPTZ,
  password      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_account_user ON auth_account (user_id);

-- ── 5. auth_verification ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_verification (
  id          TEXT PRIMARY KEY,
  identifier  TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Seed existing users into auth_user so they can still log in ────────────
-- Passwords are migrated to auth_account; BA will validate them.
INSERT INTO auth_user (id, name, email, email_verified, created_at, updated_at)
SELECT
  'legacy_' || id::text,
  COALESCE(display_name, split_part(email, '@', 1)),
  email,
  true,
  created_at,
  NOW()
FROM users
ON CONFLICT (email) DO NOTHING;

INSERT INTO auth_account (id, user_id, account_id, provider_id, password, created_at, updated_at)
SELECT
  'acct_legacy_' || u.id::text,
  'legacy_' || u.id::text,
  u.email,
  'credential',
  u.password_hash,
  u.created_at,
  NOW()
FROM users u
WHERE u.password_hash IS NOT NULL
ON CONFLICT (id) DO NOTHING;

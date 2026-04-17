-- Remove all tables that are no longer needed now that projects come
-- exclusively from GitHub and Better Auth v2 (auth_* tables) is the
-- sole auth provider.

-- ── 1. Project-related tables (FK to projects, drop first) ──────────────────
DROP TABLE IF EXISTS project_steps                CASCADE;
DROP TABLE IF EXISTS project_resources            CASCADE;
DROP TABLE IF EXISTS project_role_responsibilities CASCADE;
DROP TABLE IF EXISTS project_requirements         CASCADE;
DROP TABLE IF EXISTS projects                     CASCADE;

-- ── 2. Drop stale enums ──────────────────────────────────────────────────────
DROP TYPE IF EXISTS project_difficulty;
DROP TYPE IF EXISTS project_type;
DROP TYPE IF EXISTS requirement_type;

-- ── 3. Matchmaking pairing history (no longer used) ─────────────────────────
DROP TABLE IF EXISTS pairing_history CASCADE;

-- ── 4. Legacy JWT refresh tokens (replaced by Better Auth sessions) ──────────
DROP TABLE IF EXISTS refresh_tokens CASCADE;

-- ── 5. Legacy Better Auth v1 tables (replaced by auth_* in migration 019) ───
DROP TABLE IF EXISTS ba_sessions     CASCADE;
DROP TABLE IF EXISTS ba_accounts     CASCADE;
DROP TABLE IF EXISTS ba_verification CASCADE;

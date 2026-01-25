-- Migration: Add sessions and verification_tokens tables and extend users for Phase-2
-- Run with your migration tool (psql / knex / flyway etc.)

-- 1) Extend users table
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz NULL,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz NULL;

-- Optional: add index on locked_until for quick queries
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users (locked_until);

-- 2) Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  device_info jsonb NULL,
  ip_address inet NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  revoked_reason text NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at ON sessions (revoked_at);

-- Note: refresh_token_hash stores a server-side hash (HMAC/sha256 or argon2) - never store raw tokens

-- 3) Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  type text NOT NULL CHECK (type IN ('email_verify', 'password_reset')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON verification_tokens (type);

-- 4) Optional: housekeeping function to purge expired tokens/sessions (example)
-- This is a simple SQL you can schedule (via cron / pg_cron):
-- DELETE FROM verification_tokens WHERE used_at IS NOT NULL OR expires_at < now();
-- DELETE FROM sessions WHERE revoked_at IS NOT NULL OR expires_at < now() - INTERVAL '30 days';

-- 5) Notes for migration maintainers:
-- - Ensure the database has the pgcrypto extension or use an alternative UUID generator if gen_random_uuid() unavailable:
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- - If your users.id type is not uuid, adjust foreign key types accordingly.
-- - Backfill: set email_verified=false for existing users where unknown.
-- - Run this migration during a maintenance window if you need to backfill large datasets.

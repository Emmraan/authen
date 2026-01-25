BEGIN;

-- Add previous_refresh_token_jti to sessions for refresh rotation reuse detection
ALTER TABLE IF EXISTS sessions
  ADD COLUMN IF NOT EXISTS previous_refresh_token_jti varchar(255) NULL;

-- Index to help lookups on previous jti (optional but useful)
CREATE INDEX IF NOT EXISTS idx_sessions_previous_refresh_token_jti ON sessions(previous_refresh_token_jti);

COMMIT;

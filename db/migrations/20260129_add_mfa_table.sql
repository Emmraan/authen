BEGIN;

-- Migration: Add MFA table for Phase-3.1.a (foundation only)
-- This table stores MFA configuration per user.
-- At this stage, no MFA functionality is active - this is schema-only preparation.

CREATE TABLE IF NOT EXISTS mfa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  totp_secret_encrypted TEXT NULL,
  backup_codes_hash JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ NULL
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_mfa_user_id ON mfa (user_id);

-- Index for queries filtering by mfa_enabled status
CREATE INDEX IF NOT EXISTS idx_mfa_enabled ON mfa (mfa_enabled);

-- Notes:
-- - totp_secret_encrypted: Will store encrypted TOTP secret using KMS/KeyManager (to be implemented in later phase)
-- - backup_codes_hash: Will store hashed backup codes as JSON array (to be implemented in later phase)
-- - No secrets are generated or stored yet in this migration
-- - MFA is disabled by default for all users
-- - Runtime behavior remains unchanged after this migration

COMMIT;

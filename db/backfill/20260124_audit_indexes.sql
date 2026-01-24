-- Add indexes for audit_events to support list queries
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_events (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events (created_at DESC);

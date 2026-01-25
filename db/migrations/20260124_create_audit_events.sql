-- Migration: create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    user_id UUID NULL,
    meta JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

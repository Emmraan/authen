# Migration Runbook — Phase 2

## Purpose

This runbook describes how to apply Phase-2 database migrations (sessions, verification tokens, audit_events), perform optional backfills, and validate the system post-migration.

## Pre-reqs

- Ensure a recent backup of the database is available and tested.
- Ensure application is deployed to a maintenance channel (or use rolling deploy with feature flags).
- Set environment variable `DATABASE_URL` for the target DB and ensure connectivity.
- Install `psql` or use your DB migration tool (Flyway, Liquibase, dbmate, etc.).

## Primary Migration Files

- db/migrations/20260124_add_sessions_and_verification_tokens.sql (adds `sessions` and `verification_tokens` tables)
- db/migrations/20260124_create_audit_events.sql (adds `audit_events` table)

## Indexes and Performance

After creating audit_events, create indexes:

```sql
-- Create helpful indexes for audit_events
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_events (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events (created_at DESC);
```

## Backfill Guidance

- If you have legacy logs to migrate into `audit_events`, write a one-off script that selects from the legacy table and inserts into `audit_events` using batch transactions (e.g., 1000 rows per transaction).
- Verify a sample of migrated rows for correctness before completing the backfill.

## Zero-downtime considerations

- The new tables are additive and should not disrupt read traffic. If you add NOT NULL columns, add them with defaults or use two-step migration:
    1. Add nullable column
    2. Backfill data
    3. ALTER to set NOT NULL

## Verification

1. Run `pnpm test` in the application codebase to verify unit and integration tests pass.
2. Start the app against the migrated DB in a staging environment and exercise flows: signup, login, password reset, email verification, session rotation.
3. Verify `audit_events` contains entries for admin actions and token reuse events.

## Rollback

- If migration fails and rollback is needed, restore the DB from the snapshot taken before migration.
- For small changes, you can `DROP TABLE` the newly created tables, but restoring from backup is recommended for safety.

## Secrets and Keys

- Ensure `HMAC_SECRETS` (comma-separated with primary first) is configured in production and staged environments before rolling out token changes.
- Rotate keys using the rotate-first-add-secondary then switch primary approach described in your security policy.

## Post-migration Checklist

- Confirm backups are successful post-migration.
- Monitor error rates and auth-related metrics for at least one deploy window.
- Confirm audit events are being emitted and stored.

## Contact

Database/Platform team: db-team@example.com
Security/Audit: security@example.com

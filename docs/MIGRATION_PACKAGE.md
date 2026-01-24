# Migration Package for DB Admin

This package contains the Phase‑2 SQL migrations and instructions for applying them manually when automatic runner cannot connect from this environment.

Included files (in `db/migrations`):

- `20260124_add_sessions_and_verification_tokens.sql`
- `20260124_create_audit_events.sql`

Recommended steps for DBA (Postgres):

1. Ensure you have a tested backup/snapshot of the target database.
2. Review the SQL files in `db/migrations` for safety.
3. Apply each migration in order inside a transaction scope. Example commands:

```bash
psql "${DATABASE_URL}" -c "BEGIN; \i /path/to/db/migrations/20260124_add_sessions_and_verification_tokens.sql; COMMIT;"
psql "${DATABASE_URL}" -c "BEGIN; \i /path/to/db/migrations/20260124_create_audit_events.sql; COMMIT;"
```

Alternatively, run both in a single script:

```bash
psql "${DATABASE_URL}" -f /path/to/db/migrations/20260124_add_sessions_and_verification_tokens.sql
psql "${DATABASE_URL}" -f /path/to/db/migrations/20260124_create_audit_events.sql
```

Indexes & Backfill

After creating `audit_events`, create indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_events (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events (created_at DESC);
```

If backfilling legacy data, do batch inserts (e.g., 1000 rows per transaction) and verify samples.

Verification checks for DBA to run after migrations:

- `SELECT COUNT(*) FROM sessions;` (table exists)
- `SELECT COUNT(*) FROM verification_tokens;`
- `SELECT COUNT(*) FROM audit_events;`
- Confirm application connectivity and run smoke flows (signup/login/password reset/email verification).

If you want me to attempt running migrations again from here, provide a DB hostname that resolves from this environment or allow outbound network DNS resolution for the host.

# Staging Run & Migration Guide

This document explains how to run database migrations and smoke tests in a staging environment without Docker, or using the provided staging compose when Docker is available.

Prerequisites

- Node 22+, pnpm installed
- `DATABASE_URL` pointing to the target Postgres (staging)
- Optional: Redis URL in `RATE_LIMIT_REDIS_URL` if you want rate-limiter integration

Run migrations (no Docker)

Set `DATABASE_URL` and run the migration runner:

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
pnpm migrate:run
```

On Windows (PowerShell):

```powershell
$env:DATABASE_URL = 'postgresql://user:pass@host:5432/dbname'
pnpm migrate:run
```

If migration runner cannot connect, ensure the DB is reachable from your machine and the `DATABASE_URL` is correct.

Using staging Docker Compose (if you install Docker later)

```bash
docker compose -f docker-compose.staging.yml up -d
# Wait for Postgres to initialize (10-20s)
pnpm migrate:run
# Run smoke/e2e tests against staging (optional)
pnpm test --runInBand --config jest.config.cjs
docker compose -f docker-compose.staging.yml down
```

Notes

- The migration runner applies `.sql` files from `db/migrations` in lexicographic order inside a transaction per file.
- If a migration fails, the runner will rollback that migration and exit with non-zero status.
- Back up your DB before running migrations; see `db/MIGRATION_RUNBOOK.md` for detailed guidance.

Troubleshooting

- `ECONNREFUSED` indicates the DB URL or network is unreachable.
- Use `psql` or a DB client to validate connectivity and credentials.

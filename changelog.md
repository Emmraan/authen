Phase 2 Release Notes — Auth (developer-facing)

Release date: 2026-01-24

Overview
This release completes Phase 2 of the auth platform: secure sessions with refresh rotation, refresh-token reuse detection, DB-agnostic session stores (in-memory/Redis/Postgres), and the supporting tooling (tests, migration, CI). It is ready for deployment once infra items (DB migration, secrets, SMTP) are applied.

What’s implemented
- Refresh-token rotation with reuse detection: refresh tokens include a `jti` and sessions persist the previous refresh `jti` + hash to detect reuse and revoke all sessions.
- Session stores: implemented `InMemory`, `Redis`, and `Postgres` session repositories; `AuthModule` selects repository at runtime (prefers Redis, probes Postgres schema, falls back to in-memory).
- Token hashing & key management: KeyManager/KMS provider + HMAC fallback used to hash refresh tokens.
- Tests: unit and e2e tests that reproduce rotation and reuse-detection flows included and passing locally.
- Migration: adds `previous_refresh_token_jti` to the `sessions` table (migration file included).
- CI: workflow updated to attempt DB migrations before running lint/typecheck/tests when `DATABASE_URL` is set.

Important files (quick reference)
- Session rotation logic: `src/modules/sessions/sessions.service.ts`
- Postgres session repo: `src/modules/sessions/postgres.sessions.repository.ts`
- Auth endpoints: `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.service.ts`
- Migration: `db/migrations/20260124_99_add_previous_refresh_token_jti.sql`
- Mailer: `src/utils/mail.provider.ts`, `src/utils/mail.service.ts` (supports SMTP + Redis queue fallback)
- KMS/HMAC helpers: `src/utils/kms.provider.ts`, `src/utils/key.manager.ts`
- CI workflow: `.github/workflows/ci-full.yml`

Developer notes — deploy checklist
1) Migrate DB schema (required)
   - Apply `db/migrations/20260124_99_add_previous_refresh_token_jti.sql` in staging/production.
   - Command (with `DATABASE_URL`):
     ```bash
     pnpm migrate:run
     ```

2) Provision secrets (required)
   - Provide `HMAC_SECRETS` or configure `KMS_PROVIDER` + Vault variables when you enable Vault.
   - Env hints (see `.env.example`): `HMAC_SECRETS`, `HMAC_SECRET`, `KMS_PROVIDER`, `VAULT_ADDR`, `VAULT_TOKEN`.

3) Configure SMTP (recommended)
   - Set `MAIL_PROVIDER=smtp` and provide `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
   - If using a queue (Redis), ensure a worker consumes `MAIL_QUEUE_KEY` or set `MAIL_DIRECT=true` for immediate sends.

4) CI / deployment
   - CI will attempt migrations when `DATABASE_URL` is present. Ensure migration permissions and backups are in place.
   - Run full verify locally before creating a release: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

Testing notes
- Local test run: `pnpm test` (all unit & e2e tests passed locally during development).
- If SMTP not configured, `MailService` falls back to console output or Redis queue.

Operational notes
- Token reuse detection revokes all sessions for the user — this is logged via audit events.
- `previous_refresh_token_jti` is used for fast detection; ensure the DB migration is present in deploy targets.

Remaining operator actions (what you must do before enabling in production)
- Run DB migrations in staging & production.
- Provision secrets or enable Vault (the code supports both; Vault is optional and can be enabled later).
- Configure SMTP and verify deliverability (or wire to SES/SendGrid) and ensure mail-worker if using Redis.
- Configure monitoring/alerts for token reuse and migration failures.

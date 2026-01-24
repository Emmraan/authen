# Operations Runbook

This runbook documents operational steps for migrations, secret provisioning, SMTP configuration, CI integration, and monitoring.

## Apply DB Migrations

- Ensure `DATABASE_URL` points to the target database and is reachable.
- From the repo root run:

```bash
pnpm migrate:run
```

- The script applies SQL files from `db/migrations` in sorted order inside transactions.
- If a migration fails, the script rolls back the current migration and exits with non-zero.

## Provision KMS / HMAC Secrets

- For simple deployments, set `HMAC_SECRETS` (comma-separated values, primary first) in environment, or set `HMAC_SECRET` for single-key setups.
- For Vault usage, set `KMS_PROVIDER=vault`, and configure `VAULT_ADDR`, `VAULT_TOKEN`, and `VAULT_KV_PATH`. The Vault secret should expose `HMAC_SECRETS` or `HMAC_SECRET`.

## SMTP / Email

- Configure SMTP values (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) or set `MAIL_PROVIDER` to `console` for development.
- If Redis is available and mail worker is desired, set `MAIL_QUEUE_KEY` and ensure a worker consumes that list.
- To validate deliverability in staging, provide real SMTP credentials and send a verification email via the staging UI or test script.

## CI / Deploy Integration

- CI (`.github/workflows/ci-full.yml`) now runs `pnpm migrate:run` when `DATABASE_URL` is set in secrets. Migrations must succeed for the job to continue.
- Recommended: run migrations from a migration job in deploy pipeline before application rollout. Ensure rolling updates and backward-compatible migrations.

## Monitoring & Alerts (placeholders)

- Add alerting for:
    - Migration failures
    - Repeated token reuse events
    - Rate-limit spikes (traffic anomalies)
- Integrate logs with your logging provider and create dashboards for authentication metrics.

## Runbook: emergency rollback

- If a migration is destructive and causes issues, restore from backups and redeploy the previous app version.
- Maintain DB backups and a tested rollback plan per migration window.

---

For further operationalization, adapt these steps to your hosting environment (Kubernetes, VM, PaaS) and CI/CD provider.

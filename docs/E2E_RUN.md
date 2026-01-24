# Running E2E smoke tests against staging

Prereqs:

- A running staging instance reachable at `BASE_URL` (e.g. `http://staging.example.com`).
- `pnpm install` and project built.

Quick steps:

1. Wait for the app health endpoint (optional but recommended):

```bash
HEALTH_URL="${BASE_URL:-http://localhost:3000}/health"
node ./scripts/wait-for.js "$HEALTH_URL" 30000
```

2. Run the e2e smoke tests:

```bash
BASE_URL=http://localhost:3000 pnpm e2e:staging
# Windows PowerShell
$env:BASE_URL = 'http://localhost:3000'; pnpm e2e:staging
```

Notes:

- The e2e script uses `supertest` and expects the app endpoints to be available at `BASE_URL`.
- These tests create ephemeral users and exercise signup/login/refresh/logout flows; run them against a staging DB, not production.

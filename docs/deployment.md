# Deployment

Target production stack: **GitHub (private repo) → Vercel → persistent
hosting for the SQLite file**, domain `https://indonesiatourguide.com`.

> **Critical constraint**: the app needs a persistent filesystem (SQLite) and
> the Node.js runtime. It therefore does **not** run on Vercel's default
> serverless filesystem, which is read-only/ephemeral. Choose ONE of the
> options in "Hosting options" below before connecting the domain.

## Git workflow

```
feature/*  →  pull request  →  review  →  staging  →  production
```

- `main` — production, protected, deploys only after CI passes
- `staging` — mirrors production config with staging DB/gateway keys
- `develop` — integration branch for feature PRs

Every production deployment corresponds to a Git commit (Vercel deployment
list = audit trail). Never commit secrets — all configuration is environment
variables (see `.env.example`).

## CI pipeline (GitHub Actions, provided as reference)

```yaml
# .github/workflows/ci.yml
name: CI
on: { pull_request: {}, push: { branches: [main, staging] } }
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
      - name: E2E acceptance suite
        env:
          PAYMENT_PROVIDER: sandbox
          PAYMENT_WEBHOOK_SECRET: ci-test-secret
        run: |
          npm run start &
          npx wait-on http://localhost:3000/api/health -t 60000
          BASE=http://localhost:3000 WEBHOOK_SECRET=ci-test-secret bash scripts/e2e.sh
```

Preview deployments (Vercel PR previews) run against the staging database.

## Hosting options

### A. Vercel + external persistent disk (simplest single-region)
1. Deploy to Vercel with Node 24.
2. Attach a persistent volume (e.g. a small VPS running only this app via
   Docker, or Fly.io/Railway volume) and set `DATABASE_PATH` to its mount
   path. Alternatively point `DATABASE_PATH` at a Litestream-replicated file.
3. Set all env vars from `.env.example` (REQUIRED: `NEXT_PUBLIC_SITE_URL`,
   `AUTH_SECRET`, `PAYMENT_WEBHOOK_SECRET`).

### B. VPS / Docker (full control, recommended for SQLite)
`Dockerfile` equivalent:
```dockerfile
FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=3000 DATABASE_PATH=/data/itg.sqlite
VOLUME /data
EXPOSE 3000
CMD ["npm", "run", "start"]
```
Deploy behind a TLS reverse proxy (Caddy/Nginx); GitHub webhook → CI →
`git pull && docker build` for automatic deploys.

### C. Platform-as-a-service with volumes (Railway/Fly/Render)
Same as B but the platform manages the volume; set `DATABASE_PATH` to the
volume mount. Enable nightly backup (below) from day one.

## Production configuration checklist

- [ ] `NEXT_PUBLIC_SITE_URL=https://indonesiatourguide.com` (canonical URLs, same-origin checks)
- [ ] `AUTH_SECRET` — 96-hex random (`openssl rand -hex 48`)
- [ ] `PAYMENT_PROVIDER=midtrans` (or `bank_transfer`)
- [ ] `PAYMENT_WEBHOOK_SECRET` — stable value matching the gateway dashboard
- [ ] `MIDTRANS_SERVER_KEY` (+ `MIDTRANS_SANDBOX=false` for live); webhook URL in Midtrans dashboard: `https://indonesiatourguide.com/api/payments/webhook/midtrans`
- [ ] `SMTP_*` for transactional email (queue drains automatically once set)
- [ ] `WHATSAPP_NUMBER=62…` (or set in Admin → Settings)
- [ ] `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` for analytics
- [ ] Daily DB backup job (see `docs/backup.md`)
- [ ] DNS: apex → host, plus `www` redirect; TLS auto-renewal
- [ ] GitHub repo visibility: **PRIVATE**; branch protection on `main`

## Post-deploy smoke test

```bash
curl -f https://indonesiatourguide.com/api/health
# then run the acceptance suite against production READ paths only:
BASE=https://indonesiatourguide.com RESET=0 bash scripts/e2e.sh
```
(`RESET=0` keeps production data; the booking/payment steps create real test
bookings — prefer running the full suite on staging.)

## Staging

`staging.indonesiatourguide.com` — same code, separate database file and
Midtrans sandbox keys. Point the GitHub `staging` branch auto-deploy there.

## Legacy URL redirects (SEO preservation)

Configured in `next.config.ts` (permanent):
| Old | New |
|---|---|
| `/tours-package/:slug` | `/tours/:slug` |
| `/destination/:slug` | `/destinations/:slug` |
| `/for-agencies`, `/partner-portal` | `/agents` |
| `/guides` | `/blog` |

When migrating content from the existing site, import tours/destinations into
the DB (seed scripts in `src/data/seed/` show the shape), keep slugs identical
where possible, and add new redirect entries for any URL that must change.

## Rollback

Vercel: promote any previous deployment (instant). VPS: redeploy the previous
Git SHA. The DB is forward-compatible by design (append-only migrations); if
a migration was shipped, roll the code back only when `user_version` ≤ the
rolled-back build's expected version, or restore the pre-deploy backup.

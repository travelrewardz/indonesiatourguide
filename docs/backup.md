# Backup & Disaster Recovery

The database is a single SQLite file (`data/itg.sqlite`, WAL mode). **GitHub
is not a backup** — the DB is git-ignored by design. Treat this file like the
business's ledger: bookings, payments, customers and content live only here.

## What to back up

| Asset | Where | Frequency |
|---|---|---|
| SQLite database | `data/itg.sqlite` (+ `-wal`/`-shm` if present) | **daily**, plus pre/post deploy |
| Environment config | host env settings | on every change (document values, not secrets) |
| Uploaded/licensed media | external URLs in DB today; a volume if you add uploads | daily if self-hosted |

## Taking a consistent backup (hot)

**Never** plain `cp` a live WAL database — you can capture a torn state. Use
SQLite's backup API (online, consistent, no downtime):

```bash
sqlite3 data/itg.sqlite ".backup '/backups/itg-$(date +%F).sqlite'"
```

Or from Node (same API via node:sqlite is not required — CLI is fine), or
Litestream for continuous replication:

```bash
litestream replicate data/itg.sqlite s3:bucket/itg  # point-in-time restore
```

Verify a backup after creation:
```bash
sqlite3 /backups/itg-2026-10-10.sqlite "PRAGMA integrity_check; SELECT COUNT(*) FROM bookings;"
# expect: ok … <row count>
```

## Recommended retention (3-2-1)

- **3** copies: primary + nightly offsite + (optionally) Litestream replica
- **2** media: the server disk + object storage (S3/R2/B2)
- **1** offsite, geographically separate

Retention: keep daily for 14 days, weekly for 8 weeks, monthly for 12 months.

## Automated nightly job

Cron on the app host (or a CI scheduled workflow with SSH access):

```bash
#!/usr/bin/env bash
set -euo pipefail
DB=/data/itg.sqlite
OUT=/backups/itg-$(date +%F).sqlite.gz
sqlite3 "$DB" ".backup '/tmp/itg-backup.sqlite'"
gzip -c /tmp/itg-backup.sqlite > "$OUT"
rm -f /tmp/itg-backup.sqlite
aws s3 cp "$OUT" s3://YOUR-BUCKET/backups/ --storage-class STANDARD_IA
# prune local >14d, remote per retention policy
find /backups -name 'itg-*.sqlite.gz' -mtime +14 -delete
```

Monitor failures (email alert on non-zero exit); an unverified backup is not a
backup — alert if the nightly job hasn't succeeded in 48h.

## Restore procedure

1. Stop the app (`npm run stop` / scale to 0) — avoid writes during restore.
2. Replace the DB file:
   ```bash
   cp /backups/itg-2026-10-10.sqlite.gz /tmp/ && gunzip /tmp/itg-2026-10-10.sqlite.gz
   mv /data/itg.sqlite /data/itg.sqlite.broken
   mv /tmp/itg-2026-10-10.sqlite /data/itg.sqlite
   rm -f /data/itg.sqlite-wal /data/itg.sqlite-shm   # stale WAL from the old file
   ```
3. Start the app. On first access migrations run automatically (a backup from
   an older version is upgraded in place).
4. Smoke test: `/api/health`, homepage, `/tours`, login, latest booking page.
5. Re-point DNS/traffic if this was a region move.

**RTO/RPO targets (suggested)**: RPO ≤ 24h with daily backups (≤ minutes with
Litestream); RTO ≤ 1h for file restore + deploy.

## Disaster scenarios

| Scenario | Recovery |
|---|---|
| Bad admin edit / deleted tour | Restore yesterday's backup to a scratch DB, copy the affected rows back (`sqlite3 scratch ".dump tours"` → filtered INSERT). Bookings made today are unaffected if you merge rather than replace. |
| Ransomware / disk loss | Restore offsite backup to new host; rotate `AUTH_SECRET` and all gateway keys; audit `users`/`payments`. |
| Failed migration | Restore pre-deploy backup; roll code back to the previous Git SHA (migrations are transactional, so a failed migration leaves the DB untouched). |
| Accidental `npm run db:reset` | Restore the latest offsite backup immediately — reset wipes the local file. |

## Pre-launch checklist

- [ ] Nightly backup job scheduled and monitored
- [ ] Offsite destination configured (S3/R2/B2)
- [ ] Restore tested end-to-end on a staging box (timed — that's your RTO)
- [ ] `data/` excluded from the web root and from Git
- [ ] Backup coverage documented in the runbook; who gets alerted is named

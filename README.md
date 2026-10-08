# Indonesia Tour Guide — B2B Travel Platform

A travel platform for an Indonesian destination management company (DMC), modeled on indonesiatourguide.com. The public site sells tours directly to travellers, while trade partners (travel agencies, tour operators, corporate buyers) work through a B2B portal with **net rates, quotes (RFQs) and bookings**. Suppliers run their operations and admins run the whole catalog.

Four role-gated areas, one session cookie:

| Area | Path | Who |
|---|---|---|
| Customer account | `/account` | bookings, QR vouchers, profile |
| Travel agent portal | `/agents` | net rates, quote builder, commissions |
| Supplier operations | `/supplier` | bookings for own tours, tour CRUD, availability calendar |
| Admin back office | `/admin` | catalog, CMS, users, reports, settings |

## Features

### Public website
- Home page: hero search, destinations, signature tours, why-us, testimonials
- Tours catalog with search, destination/category filters, sorting, and a date + travellers availability search
- Tour detail pages: itinerary, inclusions, options, live availability calendar, reviews, pickup info, JSON-LD (`TouristTrip`) structured data
- Destinations, blog, FAQ, About, Contact, Privacy, Terms pages
- Booking flow (`/book/[slug]`): server-side pricing, inventory hold, guest checkout allowed
- Enquiry / RFQ form — anyone can send one; admins and agents see them
- Sitemap (`/sitemap.xml`), robots (`/robots.txt`), i18n (EN/ES/FR/DE/IT/NL/ID), display-currency preference

### Customer account (`/account`)
- Booking list + detail with progress timeline, cancel action, WhatsApp support link
- QR voucher per confirmed booking (`/account/bookings/{number}/voucher`)
- Profile: contact details, password, preferences
- In-app notifications and review submission after completed tours

### Travel agent portal (`/agents`)
- Registration → trade account (PENDING until an admin approves it)
- Dashboard: quotes, bookings, commission stats
- RFQ / quote builder: pick a tour, dates, pax → net-rate pricing preview
- Bookings with net/gross margins, CSV export
- Commission percentage per agency (seeded: 12% / 15% / 18%, stored per agent)

### Supplier operations (`/supplier`)
- Sees only bookings for tours assigned to their company
- Confirm bookings, manage tours (create/edit with images, itinerary, options)
- Availability calendar: set capacity and close dates

### Admin (`/admin`)
- Tours CRUD (incl. supplier assignment), destinations, availability
- Bookings, customers, agents (approve/deny), suppliers, enquiries, reviews
- CMS: static pages and blog (markdown)
- Reports (KPIs, CSV export), settings (company profile, contact, social links)

## API

| Endpoint | Notes |
|---|---|
| `POST /api/auth/register` \| `login` \| `logout` | session cookie, bcrypt passwords, origin-checked |
| `GET /api/tours`, `GET /api/tours/{slug}` | public catalog + detail |
| `GET /api/tours/{slug}/quote?date&pax&currency` | server-side price + live availability |
| `GET /api/tours/{slug}/availability?optionId&days` | calendar data, starts today (max 120 days) |
| `POST /api/bookings` | creates booking + inventory hold + payment intent; total computed server-side |
| `GET /api/bookings` | role-scoped list (customer/agent/supplier/admin), `?format=csv` export |
| `GET /api/bookings/{number}` | owner/agent/supplier/admin only; 404 otherwise (no enumeration) |
| `POST /api/enquiries` | public enquiries / RFQ |
| `GET/PUT/DELETE /api/manage/tours/{id}` | owner-supplier or admin |
| `GET /api/notifications`, `POST` | list + mark read |
| `POST /api/payments/webhook/{provider}` | HMAC-signed, verified before any money state change |
| `GET /api/reports` | admin KPIs |
| `GET /api/health` | healthcheck |

## Architecture

- **Data**: SQLite via the built-in `node:sqlite` driver (`data/itg.sqlite`, WAL mode). Schema is versioned migrations in `src/lib/migrations.ts` (`PRAGMA user_version`); first run auto-seeds from `src/lib/seed.ts` + `src/data/seed/*`. All access is isolated in `src/lib/*`.
- **Auth**: `SUPER_ADMIN`/`ADMIN`, `SUPPLIER`, `TRAVEL_AGENT`, `CUSTOMER` roles; bcrypt password hashes; HMAC-signed HTTP-only session cookie (`itg_session`, 14 days). Route handlers use `requireApi()` (401/403), pages use `requireUser()`, mutations verify same-origin.
- **Booking engine**: pricing and inventory runs entirely server-side (client prices are ignored). Slots are held with a guarded `UPDATE` inside `BEGIN IMMEDIATE`, so concurrent checkouts cannot overbook. Availability falls back to `max_pax` when no explicit row exists.
- **Payments**: sandbox redirect provider included for local testing; webhooks are signature-verified (HMAC-SHA256 of `paymentId:status`) and idempotent before booking/payment state transitions. Real providers plug into `src/lib/payments/index.ts`.
- **Side effects**: notifications are DB rows; emails are queued and delivered via nodemailer when `SMTP_*` env vars exist (safe no-op without them). Vouchers embed a QR code (data-URI PNG).
- **SEO**: per-page metadata, canonical URLs, Open Graph, JSON-LD structured data, dynamic sitemap/robots.

## Stack

- Next.js 15 (App Router — server components, server actions, route handlers), TypeScript strict
- Tailwind CSS v4
- Zod v4 for input validation
- bcryptjs (passwords), `node:sqlite` (database), nodemailer (email), qrcode (vouchers)

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

The database is created, migrated and seeded automatically on first run — no setup step needed.

### Environment variables (all optional for local dev)

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | session-cookie signing key (otherwise a random one is stored in `settings`) |
| `PAYMENT_WEBHOOK_SECRET` | webhook HMAC secret — **keep it stable across restarts**, or signed webhook tests/keys break (falls back to `AUTH_SECRET`, then a DB-stored secret) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | outbound email; without these, mail stays queued |
| `DATABASE_PATH` | override the SQLite file location |
| `NEXT_PUBLIC_SITE_URL` | canonical origin for links and same-origin checks |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` | optional Google Analytics / Tag Manager |

## Demo accounts

All seeded passwords are `demo1234` except the admin (`admin1234`).

| Role | Email | Password | Notes |
|---|---|---|---|
| Super admin | `admin@indonesiatourguide.com` | `admin1234` | `/admin` |
| Customer | `customer@demo.com` | `demo1234` | seeded bookings + voucher |
| Travel agent | `maria@atlasworld.es` | `demo1234` | Atlas World Travel — approved, 15% |
| Travel agent | `erik@nordicvoyages.se` | `demo1234` | Nordic Voyages AB — approved, 18% |
| Travel agent | `grace@downunderholidays.com.au` | `demo1234` | Down Under Holidays — PENDING approval |
| Supplier | `ops.eastjava@partner.indonesiatourguide.com` | `demo1234` | East Java Adventure Co. (Bromo, Ijen) |

Supplier accounts follow the pattern `ops.{key}@partner.indonesiatourguide.com` with keys
`bali`, `java`, `eastjava`, `komodo`, `ntt`, `sulawesi`, `outer`.

## Scripts

```bash
npm run dev          # dev server on :3000
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit
npm run db:reset     # wipe data/itg.sqlite back to the pristine seeded state

bash scripts/e2e.sh  # end-to-end acceptance suite (40 checks, see below)
npx tsx scripts/db-smoke.ts   # migrate/seed/verify row counts
```

### End-to-end suite

`scripts/e2e.sh` walks the full definition-of-done chain: search → quote → register →
book (inventory hold) → signed payment webhook → confirm → voucher → supplier/admin
visibility → RBAC → enquiry → concurrent overbooking guard.

```bash
BASE=http://localhost:3000 WEBHOOK_SECRET=test-secret-123 bash scripts/e2e.sh
```

- Resets the DB to pristine seed state before each run (set `RESET=0` to skip).
- Sends a per-run `X-Forwarded-For` so the in-memory rate limiter doesn't block back-to-back runs.
- Requires the server to run with `PAYMENT_WEBHOOK_SECRET=test-secret-123` (or pass the same value as `WEBHOOK_SECRET`).

## Notes

- Photos are hotlinked from Wikimedia Commons (`thumb.wikimedia.org` / `upload.wikimedia.org`), allowlisted in `next.config.ts`; `tools/harvest-images.mjs` + `tools/curate-images.mjs` maintain the image pool. Replace with licensed DMC photography for production.
- Booking numbers use the format `ITG-YYYYMMDD-NNNNN`.
- Legacy URLs redirect for SEO: `/tours-package/:slug` → `/tours/:slug`, `/destination/:slug` → `/destinations/:slug`, `/for-agencies` and `/partner-portal` → `/agents`, `/guides` → `/blog`.
- The `/pay/sandbox/{id}` page simulates a provider redirect and fires a real signed webhook — it exercises the same path a live gateway would.
- Email delivery and analytics are opt-in via env vars; locally, everything else works without configuration.

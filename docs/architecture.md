# Architecture

Indonesia Tour Guide is a single Next.js 15 (App Router) application: server
components render the public site, route handlers expose the REST API, and
server actions handle authenticated form mutations. One relational database
holds every business fact — nothing user-visible is hard-coded in source.

## High-level diagram

```
Browser
  │
  ▼
Next.js 15 (App Router, Node runtime)
  ├── Public pages (RSC)          / , /tours, /tours/[slug], /destinations, /blog …
  ├── Role dashboards (RSC)       /account, /agents, /supplier, /admin
  ├── REST API (route handlers)   /api/**
  └── Server actions              src/lib/actions.ts (authenticated mutations)
  │
  ▼
Domain layer (src/lib/*)
  ├── db.ts         connection, migrations, query helpers, transactions
  ├── auth.ts       sessions, RBAC, rate limiting, origin checks
  ├── pricing.ts    server-side price computation
  ├── availability  atomic slot holds
  ├── booking.ts    booking lifecycle (create/confirm/cancel)
  ├── payments/     provider registry (sandbox, midtrans, bank_transfer)
  ├── notify.ts     in-app notifications + email orchestration
  ├── email.ts      templates, outbox queue, SMTP delivery
  └── voucher.ts    printable voucher + QR
  │
  ▼
SQLite (node:sqlite, WAL mode)  data/itg.sqlite
```

## Module map (src/lib)

| Module | Responsibility |
|---|---|
| `db.ts` | DB singleton, `PRAGMA user_version` migrations, `all/get/run/tx` helpers |
| `migrations.ts` | ordered SQL DDL (single source of schema truth) |
| `seed.ts` + `src/data/seed/*` | first-run catalog: 32 tours, 19 destinations, users, CMS, reviews |
| `types.ts` | row types for every table + shared domain types |
| `auth.ts` | bcrypt hashing, HMAC session cookie, `requireUser`/`requireApi`, RBAC, rate limiter, same-origin check |
| `validation.ts` | Zod schemas for every mutating input |
| `pricing.ts` | price rules, sale/agent/seasonal pricing, `computePrice()` |
| `availability.ts` | `getAvailabilityForDate`, `holdSlots` (guarded UPDATE), `releaseSlots` |
| `booking.ts` | `createBooking` (single transaction), `confirmPayment`, `cancelBooking` |
| `payments/index.ts` | `PaymentProvider` interface + registry + webhook application |
| `notify.ts`, `email.ts` | notifications table, email outbox + nodemailer delivery |
| `voucher.ts` | voucher data assembly + QR (qrcode) |
| `tours-write.ts` | tour persistence shared by admin + supplier editors |
| `actions.ts` | server actions (profile, booking mgmt, moderation, CMS, settings) |
| `queries.ts` | read queries shared by public pages |
| `seo.ts`, `i18n.ts`, `currency.ts`, `prefs.ts`, `format.ts` | presentation support |

## Request flow examples

### Booking checkout
1. `/book/[slug]` (RSC) renders the form; live prices come from
   `GET /api/tours/[slug]/quote` — the server computes them via `computePrice`.
2. `POST /api/bookings` validates with Zod, then `createBooking()` runs inside
   one `BEGIN IMMEDIATE` transaction: re-price server-side → `holdSlots`
   (guarded UPDATE that fails if capacity is insufficient) → insert booking +
   payment rows → queue notifications/emails.
3. The payment provider's `createIntent` returns a redirect URL; the customer
   pays off-site (or on `/pay/sandbox/[id]` in test mode).
4. `POST /api/payments/webhook/[provider]` verifies the signature **before**
   touching state, then `confirmPayment()` flips booking → CONFIRMED and
   triggers confirmation emails + voucher availability. Idempotent.

### Admin edits a price
Admin saves the tour editor → `PUT /api/manage/tours/{id}` → `saveTour()`
writes the row → the next public page render reads the new price from the DB.
No deploy, no code change (acceptance criterion #8–10).

### Concurrency
SQLite serializes writers; `tx()` uses `BEGIN IMMEDIATE`, so two simultaneous
checkouts for the last slot are applied one after the other — the second gets
a `SOLD_OUT` 409. Verified by `scripts/e2e.sh` §12 (10 concurrent requests).

## Cross-cutting decisions

- **Runtime**: every route declares `runtime = "nodejs"` — `node:sqlite` is a
  Node builtin; nothing runs on the Edge runtime.
- **RSC serialization**: `db.all()/get()` spread rows into plain objects
  because `node:sqlite` returns null-prototype objects that React cannot
  serialize to client components.
- **Stateless server**: sessions are HMAC-signed cookies (no session table);
  the rate limiter is in-memory (single instance — swap for Redis/KV when
  scaling horizontally, see docs/security.md).
- **Email**: always queued to `email_outbox`; delivered only when SMTP is
  configured. Admins can audit what *would* have been sent.
- **i18n**: UI chrome from dictionaries (`src/lib/i18n.ts`, 7 locales);
  business logic written once; DB content is translation-ready.
- **Currency**: USD is the charged base; other currencies are display-only,
  converted server-side from `fx_rates`. Clients never compute money.

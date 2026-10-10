# Security

Threat model: public booking site handling customer data and payments.
Design principle: **never trust the client** — prices, availability, roles and
money state are computed and mutated only on the server.

## Authentication

- **Passwords**: bcrypt (cost 10) hashes in `users.password_hash`. Raw
  passwords are never stored or logged.
- **Sessions**: stateless HMAC-SHA256-signed cookie (`itg_session`),
  `httpOnly`, `SameSite=Lax`, `Secure` in production, 14-day expiry. Signature
  verified with `crypto.timingSafeEqual`; payload is just `{uid, exp}`.
- The user's status (`ACTIVE`/`SUSPENDED`/`PENDING`) is re-checked on **every**
  request — suspending an account takes effect immediately, no re-login needed.
- Login runs a bcrypt compare even for unknown emails to blunt user-enumeration
  timing attacks; responses never reveal whether an email exists.
- If `AUTH_SECRET` is unset, a random 96-byte secret is generated once and
  stored in `settings` (sessions then reset if that DB is recreated — set the
  env var in production).

## Authorization (RBAC)

Five roles: `CUSTOMER`, `TRAVEL_AGENT`, `SUPPLIER`, `ADMIN`, `SUPER_ADMIN`.

- Pages: `requireUser([...roles])` — redirects to `/login` or `/403`.
- APIs: `requireApi([...roles])` — 401/403 JSON.
- **Row-level scoping**: suppliers only reach bookings/tours joined to their
  own `suppliers.id`; agents only their own quotes/bookings; customers only
  their own bookings. `GET /api/bookings/{number}` returns 404 (not 403) to
  unauthorized users so booking numbers can't be enumerated.
- Admin actions additionally re-verify ownership inside the action/mutation
  (e.g. `cancelBookingAction` checks `ownsBooking`), not just at the page.

Verified in `scripts/e2e.sh` §10: customer → `/admin` redirect, customer tour
edit via API → 403, anonymous booking list → 401.

## CSRF & origin enforcement

- `SameSite=Lax` cookie blocks cross-site POSTs with cookies.
- Every cookie-authenticated mutating API additionally calls
  `isSameOriginRequest()`: the `Origin` header must equal
  `NEXT_PUBLIC_SITE_URL` or the request host; when absent,
  `Sec-Fetch-Site` must be `same-origin`/`none`. Foreign origins → 403.
- Server actions rely on Next.js's built-in origin checks plus the same
  session guards.

## Injection & XSS

- **SQL**: every query is parameterized (`?` placeholders via prepared
  statements) — there is no string-built user SQL anywhere.
- **XSS**: React escapes all interpolated content; the only
  `dangerouslySetInnerHTML` usages are JSON-LD blocks where `<` is escaped to
  `<`, and markdown rendering escapes raw HTML.
- Zod validation on every mutating input (register, login, booking, enquiry,
  tour editor, profile, reviews) with strict type coercion and length limits.

## Payments

- Card/wallet data never touches this system — providers are redirect/tokenized
  (Midtrans Snap). No PAN, CVV or wallet credentials in the DB.
- Webhooks are **signature-verified before any state change**
  (Midtrans: SHA-512 order+status+amount+serverKey; sandbox: HMAC-SHA256).
  Invalid → 401, zero writes.
- `confirmPayment()` is idempotent: replayed webhooks cannot double-confirm
  or double-notify.
- Amounts are recomputed server-side from the DB at booking creation and again
  at confirmation; the client-supplied price is never read.
- Gateway keys live only in environment variables (`MIDTRANS_SERVER_KEY`
  server-side only; `MIDTRANS_CLIENT_KEY` is the publishable one).

## Rate limiting

Fixed-window in-memory limiter (`rateLimit()` in `src/lib/auth.ts`):
- login: 8 / 5 min per IP+email
- register: 10 / h per IP
- booking: 20 / h per IP
- enquiries: 12 / h per IP

**Scaling note**: the limiter is per-process. On multi-instance hosting move it
to Redis/KV (same function signature) before enabling public registration.

## Secrets & configuration

- `.env*` is git-ignored; `.env.example` documents names only. Real values are
  set in the host's environment settings (Vercel project env / server env file
  with `chmod 600`), never in Git.
- No secret appears in source, README, logs or client bundles
  (`NEXT_PUBLIC_`-prefixed vars are the only client-visible ones — public IDs).
- Session/webhook secrets are read from env at runtime, never hard-coded.

## Headers & transport

- Serve behind TLS (auto-renewing). Production cookies are `Secure`.
- Recommended edge config (Caddy/Nginx or platform defaults):
  `Strict-Transport-Security: max-age=31536000; includeSubDomains`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  a CSP appropriate to your analytics provider, and `permissions` lockdown.

## Data protection

- Customer PII (name, email, phone, travel details) is stored only to operate
  bookings; supplier-facing views expose only what the operator needs to run
  the tour.
- Account deletion/anonymization requests: delete the user (bookings keep an
  anonymized snapshot — `customer_id` SET NULL).
- Admin accounts: use strong unique passwords and approve accounts manually
  (`SUPER_ADMIN` is the only role that can manage other admins' tooling).

## Pre-launch checklist

- [ ] `AUTH_SECRET` and `PAYMENT_WEBHOOK_SECRET` set from a secret manager
- [ ] HTTPS enforced; HSTS on
- [ ] Rate limiter backed by shared storage (if >1 instance)
- [ ] Midtrans webhook IP allowlist + signature on (dashboard setting)
- [ ] Admin password changed from the seeded default; demo users removed
- [ ] `robots.txt` already blocks `/admin`, `/account`, `/supplier`, `/api`,
      `/pay`, `/book` from crawlers
- [ ] Dependency audit in CI (`npm audit --production`)
- [ ] DB file not web-accessible (it lives outside the served directory)

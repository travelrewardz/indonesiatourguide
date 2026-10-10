# Database

A real relational **SQLite** database (ACID, WAL mode, real transactions,
indexes, foreign keys) accessed through Node's built-in `node:sqlite` driver —
no native compilation, no external server. File: `data/itg.sqlite`
(override with `DATABASE_PATH`).

Schema truth lives in **`src/lib/migrations.ts`** as ordered SQL DDL strings.
Migrations run automatically on first DB access and are tracked with
`PRAGMA user_version`; each migration is applied inside a transaction, so a
failure rolls back cleanly. No manual migration step exists — `npm run dev`
or `npm run start` is enough.

## Why SQLite (and how to move to PostgreSQL)

SQLite was chosen so the platform runs anywhere with zero setup while keeping
full relational semantics. All access is isolated behind small helpers in
`src/lib/db.ts` (`all`, `get`, `run`, `tx`) and domain modules in `src/lib` —
no SQL is scattered through components. Porting to PostgreSQL means swapping
those helpers for `pg` and translating the DDL (IDs are TEXT, timestamps are
ISO-8601 TEXT, booleans are INTEGER — all portable types).

## Tables (20)

### Identity & partners
| Table | Purpose | Key columns |
|---|---|---|
| `users` | all account types | email UNIQUE, bcrypt `password_hash`, `role` (CUSTOMER / TRAVEL_AGENT / SUPPLIER / ADMIN / SUPER_ADMIN), `status` (ACTIVE/PENDING/SUSPENDED) |
| `suppliers` | tour operator companies | user_id UNIQUE, company, license, `verification_status`, `commission_pct`, bank info |
| `agents` | travel agencies (B2B) | user_id UNIQUE, company, `status`, `commission_pct`, `net_rate_access` |

### Catalog
| Table | Purpose | Key columns |
|---|---|---|
| `destinations` | Bali, Komodo, … | slug UNIQUE, hero, gallery JSON, SEO fields, `featured`, `sort_order` |
| `tours` | products | slug UNIQUE, destination FK, duration, pax range, `base_price` / `sale_price` / `agent_price`, `agent_discount_pct`, status, featured, highlights/includes/excludes/faqs JSON, SEO fields, rating + review_count (denormalized) |
| `tour_images` | gallery | tour FK, url, alt, sort_order |
| `tour_itinerary` | day plan | tour FK, day, time, title, description |
| `tour_options` | bookable variants (Private Jeep, Shared Jeep…) | tour FK, price, pax range, inclusions/exclusions JSON, `is_available` |
| `tour_price_tiers` | group-size pricing (v2) | tour FK, optional option FK, min/max pax → price |
| `price_rules` | seasonal pricing (v2) | tour FK, date_from/to → price, label |

### Commerce
| Table | Purpose | Key columns |
|---|---|---|
| `availability` | per-date inventory | UNIQUE(tour, option, date), `available_slots`, `booked_slots`, status (AVAILABLE/LIMITED/SOLD_OUT/CLOSED) |
| `bookings` | reservations | booking_number UNIQUE (`ITG-YYYYMMDD-NNNNN`), denormalized customer snapshot, total/commission/supplier_amount/agent_net, payment/booking/confirmation status |
| `payments` | one row per intent | provider, amount, status, transaction_id, raw `payload` (webhook audit trail) |
| `quotes` | agent RFQs | reference UNIQUE, agent FK, net vs gross totals, status |
| `reviews` | moderated reviews | tour FK, booking_id, rating, status; approval recalculates the tour's public rating |

### Operations
| Table | Purpose |
|---|---|
| `enquiries` | contact / tailor-made / quote requests (form submissions, incl. budget, interests, accommodation) |
| `notifications` | in-app notification feed per user |
| `email_outbox` | rendered transactional emails, QUEUED → SENT/FAILED (audit + retry) |
| `cms_pages` | editable static pages (About, Terms, Privacy) — markdown |
| `blog_posts` | articles — markdown, status DRAFT/PUBLISHED |
| `fx_rates` | display-currency rates (USD base) |
| `settings` | key/value site config (contact details, WhatsApp number, session secret fallback, `seeded` marker) |

## Concurrency & the overbooking guard

Booking creation runs inside `BEGIN IMMEDIATE` (SQLite takes the write lock up
front), and slot reservation is a **guarded UPDATE**:

```sql
UPDATE availability
   SET booked_slots = booked_slots + :pax
 WHERE id = :id AND status != 'CLOSED'
   AND (available_slots - booked_slots) >= :pax
```

`changes = 0` means someone else took the last slot → the request fails with
HTTP 409 and the transaction rolls back. `scripts/e2e.sh` §12 fires 10
concurrent bookings and verifies capacity never goes negative.

## Seeding

First access with an empty DB runs `seedDatabase()`: ~12 users (admin +
demo customer/agents/suppliers), 7 suppliers, 3 agents, 19 destinations,
32 tours (90 images, 148 itinerary rows, 32 options), reviews, demo bookings,
7 blog posts, CMS pages, FX rates and settings. `npm run db:reset`
(`scripts/reset-db.ts`) returns the DB to this pristine state.

## Indexes

Every foreign key and every column used in list/filter queries is indexed
(bookings by customer/tour/status/agent/created, availability by
(tour,option,date) unique, tours by status/destination/supplier/category,
reviews by (tour,status), notifications by (user,created), …). Public list
queries always paginate (`LIMIT/OFFSET`) — the full catalog is never loaded
into one response.

## Backup

See `docs/backup.md` — SQLite's `.backup` API gives consistent hot backups;
never copy the file while WAL is active without it.

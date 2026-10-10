# API Documentation

REST API under `/api`. All responses are JSON unless noted. Authentication is
the session cookie (`itg_session`) set by `/api/auth/login`; authenticated
mutations additionally require a same-origin `Origin`/`Sec-Fetch-Site` header.
Errors: `{ "error": "message" }` with 400/401/403/404/409/429 as appropriate.

The same endpoints serve the website, and are ready for a future mobile app
or partner integrations (token-based auth would slot into `requireApi()`).

## Authentication

| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password, phone?, country?, role: "CUSTOMER"\|"TRAVEL_AGENT"\|"SUPPLIER", company?}` | Creates account; agent/supplier start PENDING admin approval. Sets session cookie. Rate-limited 10/h/IP. |
| POST | `/api/auth/login` | `{email, password}` | Sets session cookie. Returns `{ok, role, redirect}`. 8 attempts / 5 min / IP+email. |
| POST | `/api/auth/logout` | — | Destroys the session cookie. |

## Public catalog

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/tours` | Search: `q, destination, category, region, minDays, maxDays, minPrice, maxPrice, sort (featured\|price_asc\|price_desc\|rating\|duration), page, limit` → `{total, page, totalPages, items[]}` |
| GET | `/api/tours/{slug}` | Full detail: `{tour, images[], itinerary[], options[], destination}`. 404 unless PUBLISHED. |
| GET | `/api/tours/{slug}/quote` | `?optionId&date&pax&currency` → authoritative server-computed price `{pricing, display, availability, seasonalRules, canBook}`. Agent session returns agent net pricing. |
| GET | `/api/tours/{slug}/availability` | `?optionId&days=30` → per-date `{status, capacity, booked, remaining}`, starts today, max 120 days. |

## Bookings

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/bookings` | optional | `{tourSlug, optionId?, travelDate, adults, children, pickupLocation, hotel?, specialRequest?, customerName, customerEmail, customerPhone?, paymentProvider, agree}` → `{bookingNumber, paymentUrl, ...}`. **Total computed server-side**; client prices ignored. Atomically reserves inventory; 409 on sold-out. |
| GET | `/api/bookings` | required | Role-scoped list (customer=own, agent=own, supplier=own tours, admin=all). `?status`, `?limit`, `?format=csv`. |
| GET | `/api/bookings/{number}` | owner/agent/supplier/admin | Full booking + tour; 404 (not 403) for others — no enumeration. |

## Payments

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/payments/webhook/{provider}` | Provider webhook (`sandbox`, `midtrans`, `bank_transfer`). **Signature verified before any state change**; 401 on invalid signature. Idempotent — replays don't double-confirm. |

Sandbox signature: HMAC-SHA256 of `"{paymentId}:{status}"` hex with
`PAYMENT_WEBHOOK_SECRET`:
```json
{"paymentId":"pay_…","status":"PAID","signature":"<hmac>"}
```
Midtrans: SHA-512 of `order_id + status_code + gross_amount + serverKey`
compared against `signature_key` (documented Midtrans scheme).

## Enquiries (public)

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/enquiries` | `{type: "contact"\|"tailor_made"\|"quote", name, email, message, …}` — optional: phone, country, destination, travel_date, pax, budget, interests, accommodation, tour_slug. Stored in DB, admins notified. Rate-limited 12/h/IP. |

## Management (session + role required)

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/manage/tours/{id}` | ADMIN, SUPPLIER(own) | Full tour payload for the editor (JSON arrays parsed). |
| PUT | `/api/manage/tours/{id}` | ADMIN, SUPPLIER(own) | Update tour + images/itinerary/options (Zod-validated). |
| DELETE | `/api/manage/tours/{id}` | ADMIN | Fails if bookings reference the tour. |
| POST | `/api/tours` | ADMIN, SUPPLIER | Create tour (supplier = own catalogue). |
| GET/POST | `/api/notifications` | any session | List (30 latest + unread count) / mark read. |
| GET | `/api/reports?type=…` | ADMIN | `month\|destination\|tour\|supplier\|agent\|cancellation`, `&format=csv`. |
| GET | `/api/health` | public | Liveness probe. |

## Webhooks & real-time behaviour

- Payment confirmed → booking CONFIRMED, customer + admin notifications,
  confirmation email + voucher queued — all inside `confirmPayment()`.
- Booking created → supplier + admin notified (in-app + email).
- Cancellation → slots released back to `availability` atomically.
- Admin edits (price, availability, status) are visible on the next public
  page render — no cache invalidation step needed.

## Conventions

- Dates: `YYYY-MM-DD` (travel dates), ISO-8601 (timestamps).
- Money: all amounts in **USD** (base); display currencies are converted
  server-side in quote responses only.
- IDs: prefixed opaque strings (`tln_…`, `bkg_…`, `pay_…`).
- Booking numbers: `ITG-YYYYMMDD-NNNNN`.
- Pagination: `page` (1-based) + `limit` (max 60 on public endpoints).

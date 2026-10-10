# Admin Guide

Everything a non-technical administrator needs is in the web back office at
**`/admin`** — no code changes, no developer, no deploy. If you can edit a
document, you can run this site.

Sign in with your admin account (seeded locally:
`admin@indonesiatourguide.com` / `admin1234`).

## Contents of the console

| Menu | What it does |
|---|---|
| Dashboard | live KPIs: bookings (total/today/month), revenue, pending actions, top tours |
| Bookings | search, filter, confirm, mark paid, complete, cancel, export CSV |
| Tours | create/edit/unpublish/feature/delete tours |
| Destinations | add/edit destination pages (hero, gallery, SEO) |
| Availability | open/close dates, cap capacity per tour or option |
| Customers | user accounts — suspend/reactivate |
| Suppliers | operator applications — approve/reject/suspend, commission % |
| Agents | travel agencies — approve, set commission % |
| Reviews | moderate — approve/reject/hide (approving updates the public rating) |
| Enquiries | contact / tailor-made / quote requests with statuses |
| CMS | static pages (About/Terms/Privacy) and blog articles — markdown |
| Reports | sales by month/destination/tour/supplier/agent, CSV export |
| Settings | company contact details, WhatsApp number, social links |

## Common tasks

### Change a price (visible on the public site immediately)
1. **Tours → Edit** the tour.
2. Set **Base price** (list price), optionally **Sale price** (shown struck
   through) and **Agent price** (B2B net rate).
3. **Save changes** (or **Save & publish**).
4. The public tour page and `/api/tours` now show the new price on the next
   request. Nothing else to do.

### Add a seasonal price
In the tour editor, price rules (date range → price, e.g. high season) can be
added per tour/option; the booking engine applies them automatically for
travel dates inside the range.

### Open or close specific dates
**Availability** → pick a tour (and option) → for each date use
**Open** / **Close** / **Sell out**, or the form to set exact capacity.
Customers see remaining places live; every booking decrements them atomically.

### Create a tour from scratch
**Tours → + New tour**:
1. Basics: title, destination, duration, pax range, category.
2. Photos: paste image URLs (add/remove rows) — first photo is the card image.
3. Itinerary: day/time/title/description rows.
4. Options: e.g. "Private Jeep" vs "Shared Jeep", each with its own price and
   capacity.
5. Includes/Excludes/FAQs: one item per line.
6. SEO: title, description, keywords (auto-generated from defaults if empty).
7. **Save & publish** → live at `/tours/your-slug`.

### Handle a booking
**Bookings** → find it (search by number, name, email, tour):
- **Mark as paid** — for bank-transfer payments after you confirm receipt.
- **Confirm** — operator-side confirmation (suppliers normally do this).
- **Complete** — after the tour ran (unlocks the review request).
- **Cancel** — releases the inventory slots and notifies the customer.

### Approve a partner
- **Suppliers** → review the application (licence number, destinations) →
  Approve. They can then log in and manage their own tours/availability.
- **Agents** → Approve and set their commission %. Approved agencies see
  net rates in the portal.

### Publish an article
**CMS → + New article** → title, slug, markdown content, cover image,
destination, status **Published** → Save. Live at `/blog/your-slug`.

### Edit About / Terms / Privacy
**CMS** → click the page → edit markdown → **Save page**. Live immediately.

### Reply to a tailor-made request
The homepage "Plan My Trip" form stores requests in **Enquiries** with the
traveller's dates, party size, budget, interests and accommodation level.
Set status NEW → IN_PROGRESS → RESOLVED as you work them.

## Reports & exports
Every report table has a **CSV** button (opens in Excel/Numbers). The
bookings list also exports via **Export CSV**. Figures are computed live from
booking records — cancellations are excluded from revenue.

## Things you should NOT need a developer for
Tour content, prices, discounts, images, itinerary, options, availability,
capacity, destinations, blog, static pages, SEO fields, featured flags,
publish/unpublish, reviews moderation, partner approvals, commissions,
contact details, WhatsApp number — all database-driven from the UI above.

If something genuinely needs code (a new payment provider, a new automated
email), that's a developer task — see `docs/api.md` and `docs/architecture.md`.

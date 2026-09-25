# Indonesia Tour Guide — B2B Travel Platform

A B2B (business-to-business) travel platform for an Indonesian destination management company (DMC), modeled on indonesiatourguide.com. Partners (travel agencies, tour operators, corporate travel buyers) browse a public catalog of Indonesia tours and destinations, register for a trade account, and work through a partner portal with **net rates, quotes (RFQs) and bookings**.

## Features

### Public website
- Home page: hero, destinations, signature tours, why-us, languages, testimonials, CTA
- Tours catalog with filters (destination, language, duration, travel style, sort)
- Tour detail pages: itinerary, inclusions, languages, group sizes, starting price, RFQ CTA
- Destinations pages (Bali, Java, Komodo, Sumatra, Borneo, Sulawesi, Raja Ampat, Flores)
- Partner ("For Agencies") landing page explaining the B2B model + net-rate tiers
- About & Contact pages
- Enquiry / RFQ form — anyone can send an enquiry; partners get it into their portal

### B2B Partner Portal (`/partners`)
- Registration with company details → trade account (auto-approved demo, approved flag on the record)
- Login/logout with encrypted (bcrypt) passwords and HTTP-only session cookies
- Dashboard: KPI cards (open quotes, confirmed bookings, ytd value), recent activity, tier progress
- RFQ / quote builder: pick a tour, dates, pax → tiered net pricing preview per head
- Quotes list with statuses (draft, sent, negotiating, accepted, lost) and detail page
- Bookings list with confirmation codes, travel dates, gross/net, margin; detail page
- CSV export of bookings
- Net-rate tier table (Standard 10% / Silver 15% / Gold 20% / Platinum 25% off retail)
- Profile page with company info, tier progress and change-password

### API
- `POST /api/enquiries` — public enquiries / RFQ
- `POST /api/partners/register`, `POST /api/partners/login`, `POST /api/partners/logout`
- `GET/POST/PATCH /api/quotes` — partner quote builder & status
- `GET /api/bookings` — bookings list (+ `?format=csv` export)
- `GET /api/health` — healthcheck

## Stack
- Next.js 15 (App Router, server components + client components), TypeScript strict
- Tailwind CSS v4
- bcryptjs for password hashing, HTTP-only cookie sessions
- JSON file store (`data/db.json`) — swap for Postgres later; data access isolated in `src/lib/*`
- Brand logo lives at `public/logo-itg.png` (also used as favicon via `src/app/icon.png`)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Demo partner accounts

| Email | Password | Tier |
|---|---|---|
| demo@wisataagencies.com | demo1234 | Gold (20% net) |
| maria@atlastours.es | demo1234 | Silver (15% net) |

## Notes
- All photos from Unsplash (hotlinked) — replace with licensed DMC photography for production.
- Seeded catalog data lives in `src/data/catalog.ts`.
- Booking confirmation codes use the `ITG-` prefix.

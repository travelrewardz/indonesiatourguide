import type { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import { SEED_DESTINATIONS } from "../data/seed/destinations";
import { SEED_TOURS, SEED_SUPPLIERS, STD_INCLUDES, STD_EXCLUDES, STD_FAQS } from "../data/seed/tours";
import { SEED_BLOG, SEED_CMS } from "../data/seed/content";
import { nowIso } from "./db";

type Sql = DatabaseSync;

const iso = (d: Date) => d.toISOString();
const dayOffset = (days: number) => iso(new Date(Date.now() + days * 86400000));
const dateStr = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

function insert(db: Sql, table: string, row: Record<string, unknown>): string {
  const keys = Object.keys(row);
  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`;
  db.prepare(sql).run(...keys.map((k) => row[k] as never));
  return String(row.id);
}

type ReviewSeed = { tour: string; name: string; country: string; rating: number; text: string; daysAgo: number; status?: string };

const SEED_REVIEWS: ReviewSeed[] = [
  { tour: "bromo-sunrise-tour", name: "Sarah Mitchell", country: "United Kingdom", rating: 5, text: "The most surreal morning of our trip. Our guide Wayan woke us at midnight with coffee, and the sunrise over the caldera was worth every lost minute of sleep. Jeep was comfortable and safety briefings were thorough.", daysAgo: 12 },
  { tour: "bromo-sunrise-tour", name: "Jonas Weber", country: "Germany", rating: 5, text: "Organized perfectly — pickup on time, warm blankets in the jeep, and the guide knew exactly where to stand for photos. Booked the private jeep option, worth it for families.", daysAgo: 27 },
  { tour: "bromo-sunrise-tour", name: "Aiko Tanaka", country: "Japan", rating: 4, text: "Stunning views. It was crowded at the viewpoint in high season, but our guide found a quieter spot. Slightly cold without a hat — bring one!", daysAgo: 44 },
  { tour: "bali-ubud-culture-tour", name: "Emily Rodriguez", country: "United States", rating: 5, text: "Made our Bali day. Tegallalang at 9am had almost nobody there, the monkey forest was hilarious, and the Legong dance in the evening gave me chills. Our guide Kadek was wonderful with kids.", daysAgo: 8 },
  { tour: "bali-ubud-culture-tour", name: "Pieter van Dijk", country: "Netherlands", rating: 5, text: "Excellent private tour. Guide adapted the pace for my mother who walks slowly. Lunch recommendation was the best meal we had in Bali.", daysAgo: 19 },
  { tour: "bali-ubud-culture-tour", name: "Chloé Martin", country: "France", rating: 4, text: "Très bien — guide francophone sur demande, ce qui a fait toute la différence pour nous.", daysAgo: 33 },
  { tour: "nusa-penida-island-tour", name: "Michael O'Brien", country: "Ireland", rating: 5, text: "Kelingking is even bigger in person. Snorkeling stop had three turtles — the guide spotted them instantly. Long day but completely worth it.", daysAgo: 6 },
  { tour: "nusa-penida-island-tour", name: "Laura Chen", country: "Singapore", rating: 4, text: "Beautiful trip. The road on Penida is bumpy — take motion sickness tablets if you're sensitive. Boat was fast and clean.", daysAgo: 21 },
  { tour: "komodo-island-day-tour", name: "David Kim", country: "South Korea", rating: 5, text: "Saw nine dragons! The ranger was fantastic and explained their behaviour in detail. Pink Beach is real — the sand genuinely is pink up close.", daysAgo: 15 },
  { tour: "komodo-island-day-tour", name: "Hannah Fischer", country: "Germany", rating: 5, text: "Well-run operation. Snorkeling gear was clean and the lunch on the boat was better than the restaurants in town.", daysAgo: 40 },
  { tour: "komodo-phinisi-sailing-3-days", name: "James & Sophie Turner", country: "Australia", rating: 5, text: "The highlight of our honeymoon. Padar sunrise, mantas at Manta Point, and sleeping on deck under the stars. Crew were attentive without being intrusive.", daysAgo: 25 },
  { tour: "komodo-phinisi-sailing-3-days", name: "Marco Rossi", country: "Italy", rating: 5, text: "Three days of pure magic. Food on board was exceptional — freshly caught fish every night.", daysAgo: 55 },
  { tour: "borobudur-sunrise-tour", name: "Priya Sharma", country: "India", rating: 5, text: "Guide explained every relief panel like a storyteller. Punthuk Setumbu sunrise with Borobudur in the mist is a once-in-a-lifetime view.", daysAgo: 10 },
  { tour: "borobudur-sunrise-tour", name: "Tom Baker", country: "United Kingdom", rating: 5, text: "Incredible value. Hotel pickup exactly on time, and we were the first group up the hill. Highly recommend the private option for photographers.", daysAgo: 30 },
  { tour: "ijen-blue-fire-trekking", name: "Elena Petrova", country: "Spain", rating: 5, text: "Demanding but unforgettable. The blue flames in the dark are unreal, and sunrise over the lake made the 3am start worth it. Masks provided as promised.", daysAgo: 17 },
  { tour: "ijen-blue-fire-trekking", name: "Lucas Janssen", country: "Netherlands", rating: 4, text: "Tough climb — good fitness needed. Guide checked on everyone constantly. Bring gloves for the sulfur sections.", daysAgo: 48 },
  { tour: "bali-essentials-5-days", name: "Rachel Green", country: "United States", rating: 5, text: "Perfect first trip to Bali. Hotels were all lovely, transfers seamless, and the Penida day was a highlight. Nothing to organize ourselves — exactly what we wanted.", daysAgo: 35 },
  { tour: "tana-toraja-cultural-tour-3-days", name: "Frank Müller", country: "Germany", rating: 5, text: "We attended a funeral ceremony — an extraordinary privilege. Guide was Torajan himself and opened doors no tourist agency could.", daysAgo: 62 },
  { tour: "bukit-lawang-orangutan-trek", name: "Olivia Bennett", country: "New Zealand", rating: 5, text: "Met a mother and baby orangutan on day one. Jungle camp was basic but the food and fire were magic. Life-changing.", daysAgo: 70 },
  { tour: "gili-islands-snorkeling-trip", name: "Noah Williams", country: "Canada", rating: 4, text: "Great half-day out. Turtles at the first stop — kids loved it. Boat left a little late but who's counting on island time.", daysAgo: 23 },
  { tour: "bali-uluwatu-sunset-tour", name: "Yuki Sato", country: "Japan", rating: 5, text: "Tanah Lot at golden hour, then Kecak at Uluwatu with 100 voices chanting as the sun set. Transport was punctual and air-conditioned.", daysAgo: 14 },
  { tour: "rinjani-trekking-2-days", name: "Daniel Andersson", country: "Sweden", rating: 5, text: "Brutal and beautiful. Porters carried everything, guide managed the summit pace perfectly. Crater rim camp at sunset was unforgettable.", daysAgo: 80 },
  { tour: "raja-ampat-island-hopping-4-days", name: "Isabelle Laurent", country: "France", rating: 5, text: "Piaynemo exceeded every photo. Reefs in better condition than anything I've seen in the Maldives. The homestay family cooked incredible food.", daysAgo: 95 },
  { tour: "yogyakarta-city-tour", name: "Robert King", country: "United Kingdom", rating: 4, text: "Full and varied day. Prambanan late afternoon light was perfect and the batik workshop was a surprise highlight.", daysAgo: 28 },
];

const SEED_BOOKINGS: {
  number: string; customer: string; tourSlug: string; optionIdx: number; daysAgo: number; travelIn: number;
  pax: number; adults: number; children: number; total: number; payment: string; status: string; confirm: string; agent?: string; source?: string;
}[] = [
  { number: "ITG-20260912-00018", customer: "customer", tourSlug: "bromo-sunrise-tour", optionIdx: 1, daysAgo: 25, travelIn: -10, pax: 4, adults: 3, children: 1, total: 472, payment: "PAID", status: "COMPLETED", confirm: "CONFIRMED" },
  { number: "ITG-20260930-00042", customer: "customer", tourSlug: "bali-ubud-culture-tour", optionIdx: 1, daysAgo: 7, travelIn: 21, pax: 2, adults: 2, children: 0, total: 150, payment: "PAID", status: "CONFIRMED", confirm: "CONFIRMED" },
  { number: "ITG-20261004-00057", customer: "customer", tourSlug: "nusa-penida-island-tour", optionIdx: 0, daysAgo: 3, travelIn: 30, pax: 3, adults: 2, children: 1, total: 237, payment: "PENDING", status: "PENDING", confirm: "UNCONFIRMED" },
  { number: "ITG-20260918-00026", customer: "agent1", tourSlug: "komodo-phinisi-sailing-3-days", optionIdx: 0, daysAgo: 19, travelIn: 45, pax: 8, adults: 8, children: 0, total: 3080, payment: "PAID", status: "CONFIRMED", confirm: "CONFIRMED", agent: "atlas", source: "agent_portal" },
  { number: "ITG-20260925-00033", customer: "agent2", tourSlug: "bali-essentials-5-days", optionIdx: 1, daysAgo: 12, travelIn: 60, pax: 2, adults: 2, children: 0, total: 1490, payment: "PENDING", status: "PENDING", confirm: "UNCONFIRMED", agent: "nordic", source: "agent_portal" },
  { number: "ITG-20260820-00009", customer: "customer", tourSlug: "bali-uluwatu-sunset-tour", optionIdx: 0, daysAgo: 48, travelIn: -32, pax: 2, adults: 2, children: 0, total: 84, payment: "REFUNDED", status: "CANCELLED", confirm: "UNCONFIRMED" },
];

export function seedDatabase(db: Sql): void {
  const now = nowIso();
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  // Deterministic ids: the seed runs once per serverless instance (e.g. Vercel
  // /tmp SQLite), so every instance must derive the exact same rows — a random
  // id would make session tokens and cross-page lookups fail between instances.
  let seq = 0;
  const id = (p: string) => `${p}_sd${String(++seq).padStart(4, "0")}`;

  // ---------------------------------------------------------------- users
  const adminId = id("usr");
  insert(db, "users", {
    id: adminId, name: "Platform Administrator", email: "admin@indonesiatourguide.com", phone: "+62 812 3456 7890",
    country: "Indonesia", password_hash: hash("admin1234"), auth_provider: "credentials", provider_id: null,
    role: "SUPER_ADMIN", status: "ACTIVE", preferred_language: "en", created_at: now, updated_at: now,
  });
  const custId = id("usr");
  insert(db, "users", {
    id: custId, name: "Demo Customer", email: "customer@demo.com", phone: "+1 415 555 0132",
    country: "United States", password_hash: hash("demo1234"), auth_provider: "credentials", provider_id: null,
    role: "CUSTOMER", status: "ACTIVE", preferred_language: "en", created_at: dayOffset(-60), updated_at: now,
  });

  // ------------------------------------------------------------ suppliers
  const supplierUserIds: Record<string, string> = {};
  const supplierIds: Record<string, string> = {};
  SEED_SUPPLIERS.forEach((s, i) => {
    const uid = id("usr");
    supplierUserIds[s.key] = uid;
    const email = `ops.${s.key}@partner.indonesiatourguide.com`;
    insert(db, "users", {
      id: uid, name: s.company, email, phone: `+62 81${i} 5555 000${i}`,
      country: "Indonesia", password_hash: hash("demo1234"), auth_provider: "credentials", provider_id: null,
      role: "SUPPLIER", status: "ACTIVE", preferred_language: "en", created_at: dayOffset(-400 + i * 7), updated_at: now,
    });
    supplierIds[s.key] = id("sup");
    insert(db, "suppliers", {
      id: supplierIds[s.key], user_id: uid, company_name: s.company, contact_person: `Operations Manager`,
      email, phone: `+62 81${i} 5555 000${i}`, address: s.address, destinations: JSON.stringify(s.destinations),
      license_number: s.license, verification_status: "APPROVED", bank_info: "Bank Mandiri · IDR 1234567890",
      commission_pct: s.commissionPct, created_at: dayOffset(-400 + i * 7), updated_at: now,
    });
  });

  // --------------------------------------------------------------- agents
  const agentDefs = [
    { key: "atlas", company: "Atlas World Travel", contact: "Maria Lopez", email: "maria@atlasworld.es", country: "Spain", phone: "+34 91 555 0132", website: "https://atlasworld.es", commissionPct: 15 },
    { key: "nordic", company: "Nordic Voyages AB", contact: "Erik Johansson", email: "erik@nordicvoyages.se", country: "Sweden", phone: "+46 8 555 0122", website: "https://nordicvoyages.se", commissionPct: 18 },
    { key: "pending", company: "Down Under Holidays", contact: "Grace Taylor", email: "grace@downunderholidays.com.au", country: "Australia", phone: "+61 2 5550 0199", website: null, commissionPct: 12 },
  ];
  const agentIds: Record<string, string> = {};
  agentDefs.forEach((a, i) => {
    const uid = id("usr");
    insert(db, "users", {
      id: uid, name: a.contact, email: a.email, phone: a.phone, country: a.country,
      password_hash: hash("demo1234"), auth_provider: "credentials", provider_id: null,
      role: "TRAVEL_AGENT", status: "ACTIVE", preferred_language: "en", created_at: dayOffset(-200 + i * 20), updated_at: now,
    });
    agentIds[a.key] = id("agt");
    insert(db, "agents", {
      id: agentIds[a.key], user_id: uid, company: a.company, contact_person: a.contact, email: a.email,
      phone: a.phone, country: a.country, website: a.website,
      status: a.key === "pending" ? "PENDING" : "APPROVED",
      commission_pct: a.commissionPct, net_rate_access: 1, created_at: dayOffset(-200 + i * 20), updated_at: now,
    });
  });

  // --------------------------------------------------------- destinations
  const destIds: Record<string, string> = {};
  for (const d of SEED_DESTINATIONS) {
    destIds[d.slug] = id("dst");
    insert(db, "destinations", {
      id: destIds[d.slug], name: d.name, slug: d.slug, region: d.region, tagline: d.tagline,
      description: d.description, hero_image: d.hero, gallery: JSON.stringify(d.gallery),
      seo_title: d.seoTitle, seo_description: d.seoDescription, seo_keywords: d.seoKeywords,
      featured: d.featured ? 1 : 0, sort_order: d.sortOrder, created_at: now, updated_at: now,
    });
  }

  // ---------------------------------------------------------------- tours
  const tourIdsBySlug: Record<string, string> = {};
  for (const t of SEED_TOURS) {
    const tourId = id("tr");
    tourIdsBySlug[t.slug] = tourId;
    insert(db, "tours", {
      id: tourId, title: t.title, slug: t.slug, short_description: t.short, full_description: t.full,
      destination_id: destIds[t.destination] ?? null, region: t.region, duration_days: t.days,
      duration_text: t.durationText, category: t.category, difficulty: t.difficulty,
      min_pax: t.minPax, max_pax: t.maxPax, base_price: t.basePrice, sale_price: t.salePrice ?? null,
      currency: "USD", agent_price: t.agentPrice ?? null, supplier_id: supplierIds[t.supplier] ?? null,
      rating: t.rating, review_count: t.reviewCount, status: "PUBLISHED", featured: t.featured ? 1 : 0,
      highlights: JSON.stringify(t.highlights),
      includes: JSON.stringify(t.includes ?? STD_INCLUDES),
      excludes: JSON.stringify(t.excludes ?? STD_EXCLUDES),
      pickup_info: t.pickup,
      faqs: JSON.stringify(t.faqs ?? STD_FAQS),
      map_lat: t.lat ?? null, map_lng: t.lng ?? null,
      seo_title: `${t.title} | Indonesia Tour Guide`,
      seo_description: t.short,
      seo_keywords: t.seoKeywords ?? `${t.title.toLowerCase()}, Indonesia tours, ${t.region.toLowerCase()} tours`,
      created_at: dayOffset(-300), updated_at: now,
    });
    t.images.forEach((url, i) => {
      insert(db, "tour_images", { id: id("img"), tour_id: tourId, image_url: url, alt_text: `${t.title} — photo ${i + 1}`, sort_order: i });
    });
    t.itinerary.forEach((it, i) => {
      insert(db, "tour_itinerary", { id: id("itr"), tour_id: tourId, day: it.day, time: it.time ?? null, title: it.title, description: it.description, sort_order: i });
    });
    if (t.options) {
      t.options.forEach((o, i) => {
        insert(db, "tour_options", {
          id: id("opt"), tour_id: tourId, name: o.name, price: o.price, min_pax: o.minPax ?? t.minPax,
          max_pax: o.maxPax ?? t.maxPax, duration_text: o.durationText ?? null,
          inclusions: JSON.stringify(o.inclusions ?? []), exclusions: JSON.stringify(o.exclusions ?? []),
          is_available: 1, sort_order: i,
        });
      });
    }
  }

  // -------------------------------------------------------------- reviews
  const reviewCounts: Record<string, { total: number; sum: number }> = {};
  for (const r of SEED_REVIEWS) {
    const tourId = tourIdsBySlug[r.tour];
    if (!tourId) continue;
    insert(db, "reviews", {
      id: id("rev"), booking_id: null, customer_id: null, tour_id: tourId, author_name: `${r.name} (${r.country})`,
      rating: r.rating, review: r.text, photos: "[]", status: "APPROVED", created_at: dayOffset(-r.daysAgo),
    });
    const c = (reviewCounts[r.tour] ??= { total: 0, sum: 0 });
    c.total += 1;
    c.sum += r.rating;
  }
  // one pending review awaiting moderation
  const pendingTour = tourIdsBySlug["bali-essentials-5-days"];
  if (pendingTour) {
    insert(db, "reviews", {
      id: id("rev"), booking_id: null, customer_id: null, tour_id: pendingTour, author_name: "Kate Wilson (Canada)",
      rating: 5, review: "Just got back — flawless organization from airport to departure. Would book again tomorrow.",
      photos: "[]", status: "PENDING", created_at: dayOffset(-2),
    });
  }
  for (const [slug, c] of Object.entries(reviewCounts)) {
    const tourId = tourIdsBySlug[slug];
    db.prepare("UPDATE tours SET rating = ?, review_count = ? WHERE id = ?").run(
      Math.round((c.sum / c.total) * 10) / 10, c.total, tourId as never,
    );
  }

  // ------------------------------------------------- demo bookings & payments
  for (const b of SEED_BOOKINGS) {
    const tourRow = db.prepare("SELECT id, base_price FROM tours WHERE slug = ?").get(b.tourSlug) as { id: string; base_price: number } | undefined;
    if (!tourRow) continue;
    const option = db
      .prepare("SELECT id, price FROM tour_options WHERE tour_id = ? ORDER BY sort_order LIMIT 1 OFFSET ?")
      .get(tourRow.id, b.optionIdx) as { id: string; price: number } | undefined;
    const buyer = b.customer === "customer"
      ? { id: custId, name: "Demo Customer", email: "customer@demo.com", phone: "+1 415 555 0132" }
      : b.customer === "agent1"
        ? { id: agentDefs[0] ? (db.prepare("SELECT user_id FROM agents WHERE id = ?").get(agentIds["atlas"]) as { user_id: string }).user_id : "", name: "Maria Lopez", email: "maria@atlasworld.es", phone: "+34 91 555 0132" }
        : { id: (db.prepare("SELECT user_id FROM agents WHERE id = ?").get(agentIds["nordic"]) as { user_id: string }).user_id, name: "Erik Johansson", email: "erik@nordicvoyages.se", phone: "+46 8 555 0122" };
    const unit = option?.price ?? tourRow.base_price;
    const agentRate = b.agent ? (db.prepare("SELECT commission_pct FROM agents WHERE id = ?").get(agentIds[b.agent]) as { commission_pct: number }).commission_pct : null;
    insert(db, "bookings", {
      id: id("bkg"), booking_number: b.number, customer_id: buyer.id, tour_id: tourRow.id, option_id: option?.id ?? null,
      travel_date: dateStr(b.travelIn), pax: b.pax, adults: b.adults, children: b.children,
      pickup_location: "Hotel pickup", hotel: null, special_request: null,
      total_price: b.total, currency: "USD", commission: agentRate ? (b.total * agentRate) / 100 : 0,
      supplier_amount: b.total * 0.85, agent_id: b.agent ? agentIds[b.agent] : null,
      agent_net_total: b.agent ? b.total * (1 - (agentRate ?? 0) / 100) : null,
      customer_name: buyer.name, customer_email: buyer.email, customer_phone: buyer.phone,
      payment_status: b.payment, booking_status: b.status, confirmation_status: b.confirm,
      source: b.source ?? "website", created_at: dayOffset(b.daysAgo), updated_at: dayOffset(Math.min(b.daysAgo, -1)),
    });
    if (b.payment === "PAID" || b.payment === "REFUNDED") {
      const bookingRow = db.prepare("SELECT id FROM bookings WHERE booking_number = ?").get(b.number) as { id: string };
      insert(db, "payments", {
        id: id("pay"), booking_id: bookingRow.id, provider: "midtrans", amount: b.total, currency: "USD",
        status: b.payment === "PAID" ? "PAID" : "REFUNDED", transaction_id: `TXN-${b.number.slice(-8)}`,
        payment_date: dayOffset(b.daysAgo), payload: "{}", created_at: dayOffset(b.daysAgo), updated_at: dayOffset(b.daysAgo),
      });
    }
  }

  // ------------------------------------------------------------- enquiries
  insert(db, "enquiries", {
    id: id("enq"), type: "tailor_made", name: "Sophie Dubois", email: "sophie.dubois@gmail.com", phone: "+33 6 12 34 56 78",
    country: "France", tour_slug: null, destination: "Bali, Komodo", travel_date: dateStr(45), pax: 6,
    budget: "USD 2,000–2,500 pp", interests: "Culture, sailing, photography", accommodation: "Boutique hotels",
    message: "We are six friends looking for a 10-day itinerary covering Bali and Komodo. Two of us are vegetarian. We would like a mix of culture and one sailing trip.",
    status: "NEW", created_at: dayOffset(-2), updated_at: dayOffset(-2),
  });
  insert(db, "enquiries", {
    id: id("enq"), type: "contact", name: "Mark Jensen", email: "mark@jensenfamily.dk", phone: null,
    country: "Denmark", tour_slug: "bromo-sunrise-tour", destination: "East Java", travel_date: null, pax: null,
    budget: null, interests: null, accommodation: null,
    message: "Is the Bromo sunrise tour possible with a 4-year-old? And can you arrange a private car from Surabaya airport late at night?",
    status: "IN_PROGRESS", created_at: dayOffset(-1), updated_at: dayOffset(-1),
  });

  // --------------------------------------------------------------- quotes
  const qTour = tourIdsBySlug["raja-ampat-island-hopping-4-days"];
  if (qTour && agentIds["atlas"]) {
    insert(db, "quotes", {
      id: id("qte"), reference: "QT-2026-0031", agent_id: agentIds["atlas"], tour_id: qTour, option_id: null,
      customer_name: "Mr. & Mrs. Fernandez group", travel_date: dateStr(70), pax: 4,
      net_total: 2240, gross_total: 2760, status: "SENT",
      notes: "Eco-resort upgrade option included. Quote valid 14 days.",
      created_at: dayOffset(-4), updated_at: dayOffset(-4),
    });
  }

  // --------------------------------------------------------- notifications
  const notifyTargets = [
    { user: adminId, type: "enquiry", title: "New tailor-made itinerary request", body: "Sophie Dubois requested a 10-day Bali + Komodo itinerary for 6 travellers.", link: "/admin/enquiries", days: -2 },
    { user: adminId, type: "booking", title: "New booking ITG-20261004-00057", body: "Nusa Penida Island Adventure — 3 pax, awaiting payment.", link: "/admin/bookings", days: -3 },
    { user: adminId, type: "supplier", title: "New supplier application", body: "A new operator applied for verification — review documents.", link: "/admin/suppliers", days: -5 },
    { user: custId, type: "booking", title: "Booking confirmed — Bromo Sunrise Tour", body: "Your booking ITG-20260912-00018 is confirmed. Voucher is available.", link: "/account/bookings", days: -24 },
  ];
  for (const n of notifyTargets) {
    insert(db, "notifications", { id: id("ntf"), user_id: n.user, type: n.type, title: n.title, body: n.body, link: n.link, read_at: null, created_at: dayOffset(n.days) });
  }

  // ------------------------------------------------------------- blog/CMS
  for (const p of SEED_BLOG) {
    insert(db, "blog_posts", {
      id: id("blg"), title: p.title, slug: p.slug, author: p.author, cover_image: p.cover, content: p.content,
      excerpt: p.excerpt, destination_id: p.destination ? destIds[p.destination] ?? null : null,
      category: p.category, seo_title: `${p.title} | Indonesia Tour Guide`, seo_description: p.seoDescription,
      status: "PUBLISHED", published_at: dayOffset(-p.daysAgo), created_at: dayOffset(-p.daysAgo), updated_at: dayOffset(-p.daysAgo),
    });
  }
  for (const c of SEED_CMS) {
    insert(db, "cms_pages", {
      id: id("cms"), slug: c.slug, title: c.title, content: c.content,
      seo_title: `${c.title} | Indonesia Tour Guide`, seo_description: c.seoDescription, updated_at: now,
    });
  }

  // ------------------------------------------------------------- settings
  const settings: Record<string, string> = {
    company_name: "Indonesia Tour Guide",
    site_url: "https://indonesiatourguide.com",
    contact_email: "operations@indonesiatourguide.com",
    contact_phone: "+62 812 3456 7890",
    whatsapp_number: "6281234567890",
    address: "Jl. By Pass Ngurah Rai No. 88, Sanur, Denpasar, Bali 80228, Indonesia",
    base_currency: "USD",
    instagram: "https://instagram.com/indonesiatourguide",
    facebook: "https://facebook.com/indonesiatourguide",
    tripadvisor: "https://tripadvisor.com",
    license: "B.521/D-WP.4/5/2019 — Ministry of Tourism & Creative Economy",
    seeded: "1",
  };
  for (const [k, v] of Object.entries(settings)) {
    insert(db, "settings", { key: k, value: v, updated_at: now });
  }

  // -------------------------------------------------------------- fx rates
  const rates: [string, string, string, number][] = [
    ["USD", "US Dollar", "$", 1],
    ["EUR", "Euro", "€", 0.92],
    ["GBP", "British Pound", "£", 0.78],
    ["AUD", "Australian Dollar", "A$", 1.52],
    ["SGD", "Singapore Dollar", "S$", 1.34],
    ["IDR", "Indonesian Rupiah", "Rp", 15750],
  ];
  for (const [code, name, symbol, rate] of rates) {
    insert(db, "fx_rates", { currency: code, name, symbol, rate_to_usd: rate, updated_at: now });
  }
}

export type SeedBlogPost = {
  title: string;
  slug: string;
  author: string;
  cover: string;
  category: string;
  destination: string | null; // destination slug
  excerpt: string;
  content: string;
  seoDescription: string;
  daysAgo: number;
};

import * as IMG from "../images";

export const SEED_BLOG: SeedBlogPost[] = [
  {
    title: "35 Best Things to Do in Bali (Local's Guide)",
    slug: "best-things-to-do-in-bali",
    author: "Made Suryani",
    cover: IMG.bali,
    category: "Destination Guide",
    destination: "bali",
    excerpt:
      "From sunrise treks on Mount Batur to the temple dances of Ubud — the experiences our guides recommend most, organized by region.",
    seoDescription:
      "The 35 best things to do in Bali: temples, rice terraces, volcanoes, diving and cultural experiences, curated by local guides who live on the island.",
    daysAgo: 21,
    content: `Bali rewards travelers who look beyond the beach clubs. After fifteen years of running tours across the island, our guides keep coming back to the same shortlist — places and experiences that show the island at its most authentic.

## Start in Ubud, Bali's cultural heart

Ubud is where Bali's artistic soul lives. Walk the Tegallalang rice terraces early in the morning, before the tour buses arrive and the light turns flat. Continue down into the Sacred Monkey Forest, where ancient banyans shade a canyon of temples. In the evening, book a Legong dance at a village pavilion — the gamelan orchestra alone is worth the ticket.

## Watch the sun from a temple

Bali's sea temples were built for sunset. Tanah Lot sits on an offshore rock that fills with water at high tide; Uluwatu perches on a 70-metre cliff where the Kecak chorus performs as the sun drops into the Indian Ocean. For something quieter, climb to Besakih, the Mother Temple, on the slopes of Mount Agung.

## Get into the water

Nusa Penida's Kelingking viewpoint is the photograph everyone comes for, but the real treasure is underwater — manta rays at Crystal Bay and turtles off Gili Meno. Amed's black-sand coast in the east has the calmest water on the island, with the USAT Liberty shipwreck lying in ten metres of coral-encrusted steel.

## Climb a volcano

Mount Batur's sunrise trek starts at 2 a.m. and finishes with breakfast on the rim as steam vents hiss below. For a bigger objective, cross to East Java for Bromo's caldera or the blue flames of Ijen.

## Eat your way around the island

Ask your guide for a warung — the family-run kitchens where nasi campur, babi guling and sate lilit cost a fraction of restaurant prices. Market mornings in Gianyar and Singapadu are the best classroom for Balinese cooking.

## Practical tips

- The dry season (April–October) brings the best weather; July and August are busiest.
- Rent a driver for the south and east; traffic around Denpasar is heavy.
- Carry a sarong for temple visits — it's compulsory at every compound.
- Book popular sunrise tours at least a week ahead in high season.

The best Bali itinerary leaves room for nothing. Two free afternoons will always beat a schedule packed with checkmarks.`,
  },
  {
    title: "The Complete Bromo Sunrise Guide (Routes, Jeeps & Viewpoints)",
    slug: "bromo-sunrise-guide",
    author: "Dimas Prasetyo",
    cover: IMG.bromo,
    category: "Adventure",
    destination: "bromo",
    excerpt:
      "Everything you need to plan the Bromo sunrise: which viewpoint, which jeep, what to wear, and how to beat the crowds.",
    seoDescription:
      "How to see the Mount Bromo sunrise — Penanjakan viewpoints, jeep logistics from Surabaya and Malang, what to wear and when to go.",
    daysAgo: 14,
    content: `The view from Penanjakan is one of Asia's great landscapes: a smoking cone, a perfect pyramid of Mount Batok, and distant Semeru puffing ash into a pink sky. Here is how to plan it properly.

## Which viewpoint?

The original Penanjakan (King Kong Hill is the local name for the second terrace) gives the classic postcard framing. The newer Seruni Point is closer and easier for anyone who doesn't want the pre-dawn hike. Both are reached by the same 4x4 track.

## How to get there

Most travelers overnight in Cemoro Lawang, the village on the caldera rim, and walk or drive to the viewpoint at 3 a.m. Alternatively, private tours collect you from Surabaya (4 hours) or Malang (2.5 hours) around midnight — comfortable if you'd rather not change hotels.

## What to wear

Temperatures at 2,770 metres hit 5°C before dawn. Bring a fleece and windproof jacket; jeeps carry blankets. After sunrise it warms quickly, so dress in layers.

## The sea of sand

After sunrise, jeeps descend into the volcanic sea of sand. You can hire a horse to the stairway, but most people walk the 800 metres — it's flat and the ash kicks up beautifully in the morning light. The 243 steps to Bromo's rim are steep; the smell of sulfur at the top is worth the climb.

## When to go

Dry season (April–October) offers the clearest skies. Avoid Indonesian school holidays if you dislike crowds, and check the volcanic alert level — the park closes during eruptions.

## Booking

Our sunrise tours run nightly with private or shared jeeps, entrance fees and hotel transfers included. Book at least three days ahead in peak season.`,
  },
  {
    title: "Best Time to Visit Komodo: Weather, Manta Rays & Dragons",
    slug: "best-time-to-visit-komodo",
    author: "Riko Saputra",
    cover: IMG.hero,
    category: "Planning",
    destination: "komodo",
    excerpt:
      "Komodo is a year-round destination — but water clarity, manta aggregations and heat shift dramatically with the seasons.",
    seoDescription:
      "When to visit Komodo National Park: dry and wet seasons, best months for mantas and diving, and how to avoid the crowds.",
    daysAgo: 9,
    content: `There is no bad month for Komodo, but there are better months for specific things.

## April to June: the sweet spot

Post-monsoon water is at its clearest, the hills are still green from the rains, and visitor numbers are moderate. If you only have one window, take these months.

## July and August: peak season

Dry, windy and busy. The savannah hills turn golden-brown — beautiful in photographs — but liveaboard berths and ranger slots sell out weeks ahead. Book early.

## August to November: manta season

Reef mantas aggregate at cleaning stations around Manta Point and Batu Bolong through the dry-to-wet transition. Drift dives and snorkels here can put you within metres of them.

## December to March: green season

Short, intense afternoon showers rather than all-day rain. The islands look spectacularly green, prices drop and you may have viewpoints to yourself. Sailing days are chosen around the forecast.

## What about the dragons?

Komodo dragons are cold-blooded and most active in the drier months — they bask openly on trails from June to October. In the wet season they spread into the forest, but sightings remain very likely on ranger walks.

## How many days?

One day covers a dragon trek and a beach. Two or three days on a phinisi adds Padar sunrise, Manta Point, night fishing and the coral gardens most day-trippers miss.

## Practical notes

- Park fees apply per visitor and are included in our sailing packages.
- Swimming with mantas requires a guide and no sunscreen — mineral only.
- The pinch is strongest in July: reserve boats and cabins at least a month ahead.`,
  },
  {
    title: "Tumpak Sewu Waterfall Guide: Getting There, Trails & Photo Spots",
    slug: "tumpak-sewu-waterfall-guide",
    author: "Ayu Lestari",
    cover: IMG.eastJava,
    category: "Adventure",
    destination: "east-java",
    excerpt:
      "How to reach the thousand-tier amphitheatre of Tumpak Sewu safely — trail conditions, monsoon warnings and where to stand for the photos.",
    seoDescription:
      "Complete Tumpak Sewu waterfall guide — access from Malang and Lumajang, canyon trail difficulty, safety in wet season and best viewpoints.",
    daysAgo: 30,
    content: `Tumpak Sewu is a 120-metre semicircle of falling water — not one cascade but hundreds, threading down a green amphitheatre into a gorge. It is East Java's most photogenic natural site and still relatively unknown outside Indonesia.

## Where it is

The falls sit on the border of Lumajang and Malang regencies, about 3 hours from Surabaya and 90 minutes from Malang. Most visitors combine it with a Bromo sunrise, as our two-day trip does.

## The two trails

**Upper viewpoint.** A short, paved walk from the parking area reaches the rim viewpoint — the classic panorama straight down the amphitheatre. Safe and suitable for everyone.

**Lower canyon.** The descent into the gorge involves ropes, wet ladders and boulders — 30 minutes down, 45 minutes up. You arrive at the pool beneath the falls where the roar is physical. Go slowly; the rock is perpetually slick.

## Best photo conditions

Morning light falls directly into the amphitheatre before 11 a.m. After rain the flow is enormous but the mist softens everything. A polarizer helps cut spray.

## Safety

- Never attempt the canyon in heavy rain — flash floods are real and lethal.
- Wear shoes with grip; sandals will not work.
- Bring a dry bag or zip-lock for your phone.
- A local guide at the trailhead costs little and speeds up the descent.

## Where to stay

Tosari or Cemoro Lawang puts you 45 minutes away for a Bromo sunrise the next morning; Malang has the best hotel choices.`,
  },
  {
    title: "Borobudur Travel Guide: Sunrise, Tickets & How to Explore the Reliefs",
    slug: "borobudur-travel-guide",
    author: "Bayu Wibowo",
    cover: IMG.java,
    category: "Culture",
    destination: "yogyakarta",
    excerpt:
      "The world's largest Buddhist temple decoded — how to read its 2,672 relief panels, when to visit, and how to get the sunrise view.",
    seoDescription:
      "Everything about visiting Borobudur: sunrise options, ticket types, how to walk the nine levels and read the carved reliefs, plus nearby attractions.",
    daysAgo: 42,
    content: `Borobudur was built in the 9th century and abandoned to volcanic ash for centuries. Today it is the largest Buddhist temple on Earth — and the finest stone narrative ever carved.

## How the temple works

The structure is a map of the Buddhist cosmos. The hidden base represents desire, the five square terraces represent form, and the three circular terraces represent formlessness. You walk clockwise (pradakshina) upward, reading the reliefs like a book.

## Reading the reliefs

The lower galleries tell the story of the Buddha's previous lives (Jatakavadana) and his path to enlightenment (Lalitavistara). The upper circular galleries hold 72 openwork stupas, each sheltering a seated Buddha. Start at the eastern stairway and follow the panels right — that's the correct direction.

## Sunrise options

The temple itself opens at 6 a.m.; true sunrise inside the monument is restricted to special permits. The classic view is from Punthuk Setumbu hill across the Progo floodplain, or from the nearby village of Selobodo. Our sunrise tour combines both with a full guided circuit.

## Tickets and etiquette

- Entry tickets are timed and scanned at the gate — keep yours until you exit.
- A sarong is required and provided with your ticket.
- Climbing the stupas is prohibited to protect the structure.
- Hire an official guide at the entrance or book one in advance.

## Getting there

Borobudur is 90 minutes from Yogyakarta by car. Combine it with Prambanan on the same day, or take the two-day heritage tour which adds Merapi's lava fields and the Ramayana ballet.

## Where to stay

Village homestays in Wanurejo and Ketep give you the countryside experience; Yogyakarta's boutique hotels suit late-night arrivals.`,
  },
  {
    title: "Yogyakarta Travel Guide: Kraton, Malioboro and the Temple Circuit",
    slug: "yogyakarta-travel-guide",
    author: "Bayu Wibowo",
    cover: IMG.malioboro,
    category: "City Guide",
    destination: "yogyakarta",
    excerpt:
      "Java's cultural capital in four neighborhoods — where to eat gudeg, how to visit the Sultan's palace, and when the Ramayana ballet performs.",
    seoDescription:
      "Yogyakarta travel guide: Kraton palace, Malioboro street, batik workshops, Prambanan and Borobudur day trips, food and transport tips.",
    daysAgo: 36,
    content: `Yogyakarta — Jogja to locals — is Java's soul: a sultan's city of palaces, gamelan and street food that has produced Indonesia's finest artists.

## The Kraton and its satellites

The Sultan's Palace (Kraton) still houses the royal family and a court of guards in traditional dress. Arrive at 9 a.m. for the changing-of-the-guard and the便宜 batik museum nearby. North of it, Taman Sari — the water castle — is a maze of bathing pools and underground tunnels.

## Malioboro

The city's main street is a nightly carnival of becak (pedicabs), food carts and batik stalls. Eat gudeg — young jackfruit simmered in coconut milk — at a street stall, then browse the Beringharjo market for spices and batik cloth.

## The temple circuit

Prambanan rises 47 metres over an hour east of the city — arrive at opening for empty courtyards and stay for the Ramayana ballet at 7:30 p.m. on Tuesday, Friday and Saturday evenings. Borobudur lies 90 minutes northwest; do it at sunrise.

## Workshops and classes

Batik, silver and Javanese cooking classes run half a day in Kotagede and the universities' art faculties. Your hotel can book them, but our guides know family workshops that don't take bookings online.

## Getting around

Walking works in the centre; use becak or ride-hailing apps beyond it. Renting a driver for Borobudur-Prambanan day is cheaper than a tour and flexible.

## When to go

May to September is dry and pleasant. August is the busiest — but even then, Jogja feels like a village compared to Bali.`,
  },
  {
    title: "The Best Indonesia Itineraries: 7, 10 and 14 Days",
    slug: "best-indonesia-itinerary",
    author: "Made Suryani",
    cover: IMG.rajaAmpat,
    category: "Planning",
    destination: null,
    excerpt:
      "How to sequence Bali, Java, Komodo and Lombok without spending your holiday in airports — three tested itineraries.",
    seoDescription:
      "Indonesia itinerary ideas for 7, 10 and 14 days — the best order for Bali, Java, Komodo, Lombok and Raja Ampat with realistic travel times.",
    daysAgo: 5,
    content: `Indonesia spans five time zones and 17,000 islands. The difference between a great trip and an exhausting one is sequencing — here are the routes our planners use most.

## 7 days: Bali done properly

Four nights in Ubud for culture and rice terraces, three on the south coast for beaches and a Nusa Penida day trip. Skip the north unless you dive. Direct flights home from Denpasar.

## 10 days: Java and Bali

Fly into Yogyakarta. Two days for Borobudur, Prambanan and the city. Night train or flight to Surabaya, Bromo sunrise, overland to Ijen for the blue flames, ferry to Bali, finish in Ubud. This is our Java & Bali Highlights route — the highest value per day in Indonesia.

## 14 days: add Komodo and Lombok

Extend the 10-day route with a flight to Labuan Bajo for a three-day phinisi sailing, then Lombok and the Gilis for the last stretch. Fly home from Lombok (LOP) — don't backtrack to Bali.

## If you have three weeks

Add Sumatra's orangutans or Raja Ampat's reefs. Raja Ampat needs a domestic flight to Sorong and three nights minimum — worth every connection.

## Travel-time reality check

- Bali ↔ Yogyakarta: 1h30 flight
- Yogyakarta → Bromo: 5–6 hours by road
- Bali → Labuan Bajo: 1h30 flight
- Anywhere ↔ Raja Ampat: 1 domestic connection plus ferry

## Booking order

Lock in sequence: international flights, then Bromo/Ijen and Komodo sailing dates (limited departures), then everything else. Our planners build the whole chain for you in one quote.`,
  },
];

export type SeedCmsPage = {
  slug: string;
  title: string;
  content: string;
  seoDescription: string;
};

export const SEED_CMS: SeedCmsPage[] = [
  {
    slug: "about",
    title: "About Indonesia Tour Guide",
    seoDescription:
      "Indonesia Tour Guide is a licensed Indonesian destination management company connecting travelers with verified local operators across the archipelago.",
    content: `## Who we are

Indonesia Tour Guide is an Indonesian destination management company (DMC) built on one simple idea: the best way to experience this country is with the people who live here.

We work directly with licensed local operators across Bali, Java, Lombok, Flores, Sulawesi, Sumatra and Papua. No middlemen, no resold bookings — every tour on this platform is operated by a supplier we have verified in person, priced at local rates, and supported by our operations team in Denpasar.

## What we do

**For travelers** — a complete catalog of Indonesia tours you can search, price and book online, with instant confirmation, secure payment and a real human on WhatsApp throughout your trip.

**For travel agencies** — a B2B portal with net rates, instant quotes, commission tracking and voucher downloads, so you can sell Indonesia without maintaining local contracts.

**For local operators** — a supplier platform to publish tours, manage availability and pricing, and receive bookings directly from around the world.

## Our promises

- Licensed, verified local suppliers only
- Transparent pricing — no hidden markups at checkout
- Server-verified availability, so what you see is what you get
- Free date changes up to 48 hours before departure
- Support in English, Bahasa Indonesia, and ten more languages on request

## Contact

Jl. By Pass Ngurah Rai No. 88, Sanur, Denpasar, Bali 80228, Indonesia
operations@indonesiatourguide.com · WhatsApp +62 812 3456 7890`,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    seoDescription: "Booking terms and conditions for Indonesia Tour Guide tours and packages.",
    content: `## 1. Bookings

A booking is confirmed when payment has been received and a booking number has been issued. We reserve the right to decline bookings where availability cannot be confirmed.

## 2. Prices

All prices are quoted in US dollars. Local currency conversions shown on the website are for display only; the charged amount is always calculated server-side in the booking currency at the confirmed exchange rate.

## 3. Changes and cancellations by you

Free date changes are accepted up to 48 hours before departure, subject to availability. Cancellations more than 72 hours before departure receive a full refund. Cancellations within 72 hours are non-refundable unless the tour is cancelled by the operator.

## 4. Changes or cancellation by the operator

If an operator cancels (weather, volcanic activity, safety), you receive a full refund or a free rebooking — your choice.

## 5. Conduct

Guides and operators reserve the right to remove guests who endanger themselves, wildlife or other participants. Komodo National Park rules and ranger instructions are mandatory.

## 6. Liability

We act as the booking agent for licensed operators. Liability for tour delivery rests with the operating supplier, within the limits of Indonesian tourism law.

## 7. Governing law

These terms are governed by the laws of the Republic of Indonesia.`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    seoDescription: "How Indonesia Tour Guide collects, uses and protects your personal data.",
    content: `## What we collect

Account details (name, email, phone, country), booking information (travel dates, pickup details) and technical data (device, pages viewed) needed to run the service.

## Why we collect it

To process bookings, take payment, deliver vouchers, send transactional messages and improve the platform. Marketing emails are sent only with your consent and include a one-click unsubscribe.

## Payment data

Card and wallet details are handled entirely by our payment providers (Midtrans, Xendit, Stripe, PayPal). We never see, store or process raw card numbers — payments are tokenized by the provider and confirmed to us by signed webhooks.

## Sharing

Booking details are shared with the operator delivering your tour — never with anyone else. We do not sell personal data.

## Retention and rights

Booking records are retained for tax and legal requirements (5 years). You may request access, correction or deletion of your account data at any time by writing to privacy@indonesiatourguide.com.

## Cookies

Essential cookies keep you signed in and remember your currency and language preferences. Analytics cookies are optional and controlled from the cookie banner.`,
  },
];

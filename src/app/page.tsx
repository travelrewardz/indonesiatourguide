import Link from "next/link";
import Image from "next/image";
import { HERO_IMAGE } from "@/data/hero";
import TourCard from "@/components/TourCard";
import HeroSearch from "@/components/HeroSearch";
import EnquiryForm from "@/components/EnquiryForm";
import JsonLd from "@/components/JsonLd";
import { featuredTours, publishedDestinations, setting, tourCategories } from "@/lib/queries";
import { get } from "@/lib/db";
import { getDisplayCurrency, getLocale } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { breadcrumbLd } from "@/lib/seo";

const WHY_US = [
  { icon: "🧭", title: "Local experts", text: "Born-and-raised guides in every region we operate — not call-centre scripts." },
  { icon: "📜", title: "Licensed suppliers", text: "Every operator is verified, insured and licensed by the Ministry of Tourism." },
  { icon: "💰", title: "Best local rates", text: "We contract at local rates — no foreign middlemen inflating your price." },
  { icon: "🔒", title: "Secure booking", text: "Encrypted payments through Midtrans & international gateways. No card data stored." },
  { icon: "🔄", title: "Flexible changes", text: "Free date changes up to 48 hours before departure on almost every tour." },
  { icon: "\ud83e\udd1d", title: "Real human support", text: "WhatsApp a real person in Bali — typical reply time under 2 hours." },
];

export default async function HomePage() {
  const [currency, locale] = await Promise.all([getDisplayCurrency(), getLocale()]);
  const tr = (k: string) => t(locale, k);
  const destinations = publishedDestinations(true).slice(0, 11);
  const tours = featuredTours(8);
  const categories = tourCategories();

  const stats = {
    tours: get<{ c: number }>("SELECT COUNT(*) AS c FROM tours WHERE status = 'PUBLISHED'")?.c ?? 0,
    destinations: get<{ c: number }>("SELECT COUNT(*) AS c FROM destinations")?.c ?? 0,
    operators: get<{ c: number }>("SELECT COUNT(*) AS c FROM suppliers WHERE verification_status = 'APPROVED'")?.c ?? 0,
    travellers: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE booking_status IN ('CONFIRMED','COMPLETED')")?.c ?? 0,
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <Image src={HERO_IMAGE} alt="Padar Island viewpoint, Komodo National Park" fill priority
          className="-z-10 object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/45 to-black/65" />
        <div className="container-x flex min-h-[640px] flex-col items-center justify-center py-20 text-center text-white">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            17,000 islands · one archipelago · endless discovery
          </div>
          <h1 className="font-display mt-4 max-w-4xl text-4xl font-medium leading-[1.08] sm:text-6xl lg:text-7xl">
            Discover Indonesia With <em className="text-accent">Local Experts</em>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">
            {tr("hero.subtitle")}
          </p>

          <HeroSearch
            destinations={destinations}
            labels={{
              destination: tr("search.destination"), date: tr("search.date"), travelers: tr("search.travelers"),
              type: tr("search.type"), any: tr("search.any"), submit: tr("search.submit"), plan: tr("search.plan"),
            }}
          />

          <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [String(stats.tours), "Bookable tours"],
              [String(stats.destinations), "Destinations"],
              [String(stats.operators), "Verified operators"],
              [String(stats.travellers), "Trips confirmed"],
            ].map(([big, small]) => (
              <div key={small} className="glass-card px-4 py-6">
                <div className="font-display text-3xl font-semibold text-accent">{big}</div>
                <div className="mt-1 text-xs font-medium text-white/85 sm:text-sm">{small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED DESTINATIONS */}
      <section className="py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-medium sm:text-4xl">Choose your Indonesia</h2>
              <p className="mt-2 max-w-xl text-gray-600">
                From sacred Bali to the dragon islands — every region guided by locals who call it home.
              </p>
            </div>
            <Link href="/destinations" className="btn-outline">All destinations</Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.slice(0, 8).map((d) => (
              <Link key={d.slug} href={`/destinations/${d.slug}`} className="group relative h-60 overflow-hidden rounded-2xl">
                <Image src={d.hero_image ?? ""} alt={d.name} fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <div className="text-xs uppercase tracking-widest text-sand-200">{d.tagline}</div>
                  <div className="mt-0.5 text-xl font-bold">{d.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED TOURS — database-driven */}
      <section className="bg-sand-50 py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-medium sm:text-4xl">Signature tours</h2>
              <p className="mt-2 max-w-xl text-gray-600">
                Live prices and availability — updated by our operators in real time.
              </p>
            </div>
            <Link href="/tours" className="btn-outline">Browse all {stats.tours} tours</Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} currency={currency} badge={tour.featured ? undefined : undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* WHY BOOK WITH US */}
      <section className="py-20">
        <div className="container-x">
          <h2 className="font-display text-center text-3xl font-medium sm:text-4xl">Why book with us</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
            We are an Indonesian company selling Indonesia — the margin stays in the country you came to visit.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((w) => (
              <div key={w.title} className="card p-6">
                <div className="text-3xl">{w.icon}</div>
                <h3 className="mt-3 text-lg font-bold">{w.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-gray-600">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOUR TYPES */}
      <section className="border-y border-gray-100 bg-white py-14">
        <div className="container-x flex flex-wrap items-center justify-center gap-3">
          <span className="mr-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Explore by style:</span>
          {categories.map((c) => (
            <Link key={c} href={`/tours?category=${encodeURIComponent(c)}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700">
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* TAILOR-MADE */}
      <section className="bg-brand-700 py-20 text-white">
        <div className="container-x grid items-start gap-10 lg:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Tailor-made Indonesia</div>
            <h2 className="font-display mt-3 text-3xl font-medium sm:text-4xl">
              Tell us your dream trip — we&apos;ll design it
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-white/85">
              Dates, budget, interests, accommodation level — share the details and a local planner will build a
              day-by-day itinerary with transparent pricing. No obligation, no call centre.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li>✓ Response within 24 hours</li>
              <li>✓ Unlimited revisions until you&apos;re happy</li>
              <li>✓ Direct booking with licensed operators</li>
            </ul>
          </div>
          <div className="text-ink">
            <EnquiryForm type="tailor_made" submitLabel="Plan My Trip" />
          </div>
        </div>
      </section>

      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }])} />
    </div>
  );
}

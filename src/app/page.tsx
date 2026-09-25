import Link from "next/link";
import Image from "next/image";
import { DESTINATIONS, TOURS, WHY_US, TESTIMONIALS, LANGUAGES } from "@/data/catalog";
import TourCard from "@/components/TourCard";
import HeroSearch from "@/components/HeroSearch";

export default function HomePage() {
  const featured = TOURS.slice(0, 6);
  return (
    <div>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/hero-itg.png"
          alt="Indonesia collage — Balinese dancer, Komodo dragon, temples, volcanoes and turquoise bays"
          fill
          priority
          className="-z-10 object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-black/40" />
        <div className="container-x flex min-h-[680px] flex-col items-center justify-center py-24 text-center text-white">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-accent">
            17,000 islands · endless discovery
          </div>
          <h1 className="font-display mt-4 max-w-4xl text-5xl font-medium leading-[1.1] sm:text-6xl lg:text-7xl">
            Discover the Magic of{" "}
            <em className="text-accent">Indonesia</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/90">
            Explore the world&apos;s most breathtaking archipelago — from
            Bali&apos;s sacred temples to Komodo&apos;s ancient dragons.
          </p>

          <div className="glass-card mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold">
            <span className="text-accent">🌐</span>
            Guides on request in 10 languages
          </div>

          <HeroSearch />

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              { label: "Day Tour", href: "/tours?maxDays=5" },
              { label: "Multi-Day Package", href: "/tours" },
              { label: "Destinations", href: "/destinations" },
            ].map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="glass-card rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                {chip.label}
              </Link>
            ))}
          </div>

          <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ["500+", "Tours & Activities"],
              ["100+", "Destinations"],
              ["4.7 / 5.0", "Happy Travelers"],
            ].map(([big, small]) => (
              <div key={small} className="glass-card px-6 py-8">
                <div className="font-display text-3xl font-semibold text-accent">
                  {big}
                </div>
                <div className="mt-1 text-sm font-medium text-white/85">
                  {small}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Choose your Indonesia
              </h2>
              <p className="mt-2 max-w-xl text-gray-600">
                From sacred Bali to the dragon islands — every region guided by
                locals who call it home.
              </p>
            </div>
            <Link href="/destinations" className="btn-outline">
              All destinations
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DESTINATIONS.slice(0, 8).map((d) => (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className="group relative h-64 overflow-hidden rounded-2xl"
              >
                <Image
                  src={d.image}
                  alt={d.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <div className="text-xs uppercase tracking-widest text-sand-200">
                    {d.tagline}
                  </div>
                  <div className="text-xl font-bold">{d.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED TOURS */}
      <section className="bg-sand-50 py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Signature journeys
              </h2>
              <p className="mt-2 max-w-xl text-gray-600">
                Private departures, flexible dates — every tour guided in your
                client&apos;s language.
              </p>
            </div>
            <Link href="/tours" className="btn-outline">
              View all tours
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20">
        <div className="container-x">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Why agencies choose us
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((w) => (
              <div key={w.title} className="card p-6">
                <h3 className="font-bold text-brand-700">{w.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-brand-900 py-20 text-white">
        <div className="container-x">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            What partners say
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.author} className="rounded-2xl bg-white/5 p-6">
                <blockquote className="text-sm leading-7 text-sand-100">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <div className="font-semibold text-white">{t.author}</div>
                  <div className="text-sand-200">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* B2B CTA */}
      <section className="py-20">
        <div className="container-x">
          <div className="rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 px-8 py-14 text-center text-white sm:px-14">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Travel agency? Get net rates up to 25% off.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/90">
              Register for a trade account and access the partner portal —
              quotes, bookings and tiered net pricing in one place.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/partners/register" className="btn-white">
                Become a partner
              </Link>
              <Link
                href="/partners/login"
                className="btn border border-white/60 text-white hover:bg-white/10"
              >
                Partner login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

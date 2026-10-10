import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookingPanel from "@/components/BookingPanel";
import JsonLd from "@/components/JsonLd";
import TourCard from "@/components/TourCard";
import { all, get } from "@/lib/db";
import { getOptions, getTourBySlug, lowestTierPrice, tourTiers } from "@/lib/pricing";
import { listAvailability } from "@/lib/availability";
import { destinationBySlug, similarTours, tourImages, tourReviews, setting } from "@/lib/queries";
import { getDisplayCurrency, getLocale } from "@/lib/prefs";
import { buildMetadata, breadcrumbLd, tourLd, absoluteUrl } from "@/lib/seo";
import { displayMoney } from "@/lib/currency";
import { fmtDate } from "@/lib/format";
import { whatsappLink } from "@/lib/booking";
import { t } from "@/lib/i18n";
import type { TourItineraryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) return buildMetadata({ title: "Tour not found", path: `/tours/${slug}`, noIndex: true });
  const images = tourImages(tour.id);
  return buildMetadata({
    title: tour.seo_title ?? tour.title,
    description: tour.seo_description ?? tour.short_description ?? undefined,
    keywords: tour.seo_keywords,
    path: `/tours/${tour.slug}`,
    image: images[0]?.image_url ?? null,
  });
}

export default async function TourDetailPage({ params }: Ctx) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour || tour.status !== "PUBLISHED") notFound();

  const [currency, locale] = await Promise.all([getDisplayCurrency(), getLocale()]);
  const tr = (k: string) => t(locale, k);

  const images = tourImages(tour.id);
  const options = getOptions(tour.id);
  const itinerary = all<TourItineraryItem>("SELECT * FROM tour_itinerary WHERE tour_id = ? ORDER BY sort_order, day, rowid", tour.id);
  const destination = tour.destination_id ? get<{ name: string; slug: string }>("SELECT name, slug FROM destinations WHERE id = ?", tour.destination_id) : undefined;
  const reviews = tourReviews(tour.id);
  const similar = similarTours(tour, 3);
  const includes = parseJson<string[]>(tour.includes, []);
  const excludes = parseJson<string[]>(tour.excludes, []);
  const highlights = parseJson<string[]>(tour.highlights, []);
  const faqs = parseJson<{ q: string; a: string }[]>(tour.faqs, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = listAvailability(tour, null, today, 14);

  const listPrice = tour.base_price;
  const salePrice = tour.sale_price && tour.sale_price > 0 ? tour.sale_price : null;
  const lowestTier = lowestTierPrice(tour.id);
  const tierLadder = tourTiers(tour.id);
  const fromPrice = Math.min(
    lowestTier ?? Infinity,
    salePrice ?? Infinity,
    options.length ? Math.min(...options.map((o) => o.price)) : Infinity,
    tour.base_price,
  );

  const waMessage = `Hello Indonesia Tour Guide, I am interested in the ${tour.title} for ${Math.max(1, tour.min_pax)} people on ${fmtDate(today)}.`;
  const heroImage = images[0]?.image_url ?? null;

  const breadcrumb = [
    { name: "Home", path: "/" },
    { name: "Tours", path: "/tours" },
    ...(destination ? [{ name: destination.name, path: `/destinations/${destination.slug}` }] : []),
    { name: tour.title, path: `/tours/${tour.slug}` },
  ];

  return (
    <div className="bg-white">
      {/* GALLERY */}
      <section className="relative">
        <div className="container-x grid gap-2 py-6 md:grid-cols-4 md:grid-rows-2">
          <div className="relative h-72 overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 md:h-full md:min-h-[420px]">
            {heroImage && <Image src={heroImage} alt={tour.title} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />}
          </div>
          {images.slice(1, 5).map((img, i) => (
            <div key={img.id} className={`relative hidden overflow-hidden rounded-2xl md:block ${i === 3 ? "hidden xl:block" : ""}`}>
              <Image src={img.image_url} alt={img.alt_text ?? tour.title} fill className="object-cover" sizes="25vw" />
            </div>
          ))}
        </div>
      </section>

      <div className="container-x pb-16">
        {/* BREADCRUMBS */}
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
          {breadcrumb.map((b, i) => (
            <span key={b.path} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {i === breadcrumb.length - 1 ? (
                <span className="line-clamp-1 max-w-60 text-gray-700">{b.name}</span>
              ) : (
                <Link href={b.path} className="hover:text-brand-600">{b.name}</Link>
              )}
            </span>
          ))}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* MAIN */}
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {tour.category && <span className="badge bg-brand-50 text-brand-700">{tour.category}</span>}
              {tour.difficulty && <span className="badge bg-sand-100 text-ink">Difficulty: {tour.difficulty}</span>}
              {tour.featured ? <span className="badge bg-accent/10 text-accent-dark">★ Featured</span> : null}
            </div>

            <h1 className="font-display mt-3 text-3xl font-medium leading-tight sm:text-4xl">{tour.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {tour.rating > 0 && (
                <span className="flex items-center gap-1 font-semibold text-ink">
                  <span className="text-accent">★</span> {tour.rating.toFixed(1)}
                  <span className="font-normal text-gray-400">({tour.review_count} {tour.review_count === 1 ? tr("tour.review") : tr("tour.reviews")})</span>
                </span>
              )}
              <span>⏱ {tour.duration_text ?? `${tour.duration_days} day(s)`}</span>
              {destination && <span>📍 {destination.name}{tour.region ? `, ${tour.region}` : ""}</span>}
              <span>👥 {tour.min_pax}–{tour.max_pax} per group</span>
            </div>

            <p className="mt-5 text-lg leading-8 text-gray-700">{tour.short_description}</p>

            {/* OVERVIEW */}
            <section id="overview" className="mt-10">
              <h2 className="font-display text-2xl font-medium">{tr("tour.overview")}</h2>
              <div className="mt-3 whitespace-pre-line leading-8 text-gray-700">{tour.full_description}</div>
            </section>

            {/* HIGHLIGHTS */}
            {highlights.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-2xl font-medium">{tr("tour.highlights")}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 rounded-xl bg-sand-50 p-3.5 text-sm text-gray-700">
                      <span className="mt-0.5 text-brand-600">✓</span> {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ITINERARY */}
            {itinerary.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-2xl font-medium">{tr("tour.itinerary")}</h2>
                <ol className="mt-4 space-y-4">
                  {itinerary.map((item, i) => (
                    <li key={item.id} className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                          {item.day}
                        </span>
                        {i < itinerary.length - 1 && <span className="mt-1 w-px flex-1 bg-gray-200" />}
                      </div>
                      <div className="pb-2">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-bold">{item.title}</span>
                          {item.time && <span className="badge bg-gray-100 text-gray-600">{item.time}</span>}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-gray-600">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* INCLUDED / EXCLUDED */}
            <section className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6">
                <h3 className="font-bold text-brand-800">{tr("tour.included")}</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {includes.map((i) => <li key={i} className="flex gap-2"><span className="text-brand-600">✓</span>{i}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
                <h3 className="font-bold text-red-800">{tr("tour.excluded")}</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {excludes.map((i) => <li key={i} className="flex gap-2"><span className="text-red-400">✕</span>{i}</li>)}
                </ul>
              </div>
            </section>

            {/* PICKUP */}
            <section className="mt-10">
              <h2 className="font-display text-2xl font-medium">{tr("tour.pickup")}</h2>
              <p className="mt-3 rounded-xl bg-gray-50 p-5 text-sm leading-6 text-gray-700">{tour.pickup_info}</p>
            </section>

            {/* AVAILABILITY */}
            <section className="mt-10">
              <h2 className="font-display text-2xl font-medium">{tr("tour.availability")}</h2>
              <p className="mt-1 text-sm text-gray-500">Live capacity for the next 14 days — updated with every booking.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {upcoming.map((d) => (
                  <div key={d.date}
                    className={`w-24 rounded-xl border px-3 py-2.5 text-center text-xs ${
                      d.status === "AVAILABLE" ? "border-brand-200 bg-brand-50 text-brand-700" :
                      d.status === "LIMITED" ? "border-amber-200 bg-amber-50 text-amber-700" :
                      d.status === "SOLD_OUT" ? "border-red-200 bg-red-50 text-red-600" :
                      "border-gray-200 bg-gray-50 text-gray-500"
                    }`}>
                    <div className="font-semibold">{fmtDate(d.date, locale).replace(/ \d{4}$/, "")}</div>
                    <div className="mt-0.5 text-[11px]">
                      {d.status === "AVAILABLE" ? `${d.remaining} spots` :
                       d.status === "LIMITED" ? `${d.remaining} left` :
                       d.status === "SOLD_OUT" ? tr("tour.soldOut") : tr("tour.closed")}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PRICING */}
            <section className="mt-10">
              <h2 className="font-display text-2xl font-medium">{tr("tour.pricing")}</h2>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Option</th>
                      <th className="px-4 py-3">Price / person</th>
                      <th className="px-4 py-3">Group size</th>
                      <th className="px-4 py-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(options.length ? options : [{ id: "", name: "Standard tour", price: fromPrice, min_pax: tour.min_pax, max_pax: tour.max_pax, duration_text: tour.duration_text, inclusions: "[]", exclusions: "[]", is_available: 1, sort_order: 0, tour_id: tour.id, description: null }]).map((o) => (
                      <tr key={o.id || "std"}>
                        <td className="px-4 py-3 font-medium">{o.name}</td>
                        <td className="px-4 py-3">
                          {displayMoney(o.price, currency)}
                          {o.price < listPrice && (
                            <span className="ml-2 text-xs text-gray-400 line-through">{displayMoney(listPrice, currency)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{o.min_pax}–{o.max_pax}</td>
                        <td className="px-4 py-3 text-gray-600">{o.duration_text ?? tour.duration_text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tierLadder.length > 0 && (
                <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
                  <div className="text-sm font-semibold text-ink">Group pricing — the more people, the lower the price</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tierLadder.map((tier) => (
                      <span key={`${tier.option_id}-${tier.min_pax}-${tier.max_pax ?? "x"}`} className="rounded-full border border-brand-200 bg-white px-3 py-1 text-sm text-brand-700">
                        {tier.label ?? `${tier.min_pax}–${tier.max_pax ?? "+"} pax`}: <b>{displayMoney(tier.price, currency)}</b>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                All prices are charged in USD by the server after availability is confirmed. {displayMoney(fromPrice, currency)} from per person
                {fromPrice < listPrice ? ` (${displayMoney(listPrice, currency)} regular)` : ""}.
              </p>
            </section>

            {/* REVIEWS */}
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-medium">{tr("tour.reviews")}</h2>
                <div className="text-sm text-gray-500">
                  {tour.review_count > 0 ? `★ ${tour.rating.toFixed(1)} / 5 · ${tour.review_count} ${tr("tour.reviews")}` : "No reviews yet"}
                </div>
              </div>
              {reviews.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {reviews.map((r) => (
                    <article key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{r.author_name}</div>
                        <div className="text-accent">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></div>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-400">{fmtDate(r.created_at, locale)}</div>
                      <p className="mt-2 text-sm leading-6 text-gray-700">{r.review}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-gray-50 p-6 text-sm text-gray-600">
                  This tour hasn&apos;t been reviewed yet — be the first after your trip!
                </p>
              )}
            </section>

            {/* FAQ */}
            {faqs.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-2xl font-medium">{tr("tour.faqs")}</h2>
                <div className="mt-4 space-y-3">
                  {faqs.map((f, i) => (
                    <details key={f.q} className="group rounded-xl border border-gray-200 p-4" open={i === 0}>
                      <summary className="cursor-pointer font-semibold marker:hidden">
                        <span className="float-right text-brand-600 transition-transform group-open:rotate-45">＋</span>
                        {f.q}
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-gray-600">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* MAP */}
            {tour.map_lat && tour.map_lng && (
              <section className="mt-10">
                <h2 className="font-display text-2xl font-medium">{tr("tour.map")}</h2>
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
                  <iframe
                    title={`Map of ${tour.title}`}
                    width="100%"
                    height="340"
                    loading="lazy"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${tour.map_lng - 0.08}%2C${tour.map_lat - 0.06}%2C${tour.map_lng + 0.08}%2C${tour.map_lat + 0.06}&layer=mapnik&marker=${tour.map_lat}%2C${tour.map_lng}`}
                  />
                </div>
              </section>
            )}

            {/* CUSTOM QUOTE */}
            <section className="mt-10 rounded-2xl bg-brand-700 p-6 text-white sm:p-8">
              <h3 className="font-display text-2xl font-medium">Need this tour tailored or private?</h3>
              <p className="mt-2 max-w-xl text-white/80">
                We adjust the itinerary, group size, language and hotels — tell us what you need and get a
                personalised quote within 24 hours.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/contact?type=quote&tour=${tour.slug}`} className="btn-accent">{tr("tour.customQuote")}</Link>
                <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer"
                  className="btn-white">💬 {tr("tour.whatsapp")}</a>
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <BookingPanel
              tourSlug={tour.slug}
              options={options}
              currency={currency}
              minPax={tour.min_pax}
              maxPax={tour.max_pax}
              whatsappUrl={whatsappLink(waMessage)}
              labels={{
                selectOption: tr("tour.selectOption"),
                selectDate: tr("tour.selectDate"),
                adults: tr("tour.adults"),
                children: tr("tour.children"),
                bookNow: tr("tour.bookNow"),
                liveTotal: tr("checkout.liveTotal"),
                from: tr("tour.from"),
                perPerson: tr("tour.perPerson"),
                available: tr("tour.available"),
                limited: tr("tour.limited"),
                soldOut: tr("tour.soldOut"),
                closed: tr("tour.closed"),
                whatsapp: tr("tour.whatsapp"),
              }}
            />
            <div className="card mt-5 space-y-3 p-5 text-sm text-gray-600">
              <div className="flex items-start gap-2"><span>🔒</span> Secure checkout — your card details never touch our servers.</div>
              <div className="flex items-start gap-2"><span>🔄</span> Free date changes up to 48 hours before departure.</div>
              <div className="flex items-start gap-2"><span>✅</span> Instant booking confirmation & QR voucher.</div>
              <div className="flex items-start gap-2"><span>🌿</span> Licensed local operator: {setting("company_name", "Indonesia Tour Guide")}.</div>
            </div>
          </aside>
        </div>

        {/* SIMILAR */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-medium">{tr("tour.similar")}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => <TourCard key={s.id} tour={s} currency={currency} />)}
            </div>
          </section>
        )}
      </div>

      <JsonLd data={tourLd({
        tour,
        path: `/tours/${tour.slug}`,
        image: heroImage,
        destinationName: destination?.name ?? null,
        reviews: reviews.map((r) => ({ author: r.author_name, rating: r.rating, body: r.review ?? "", date: r.created_at })),
        faqs,
      })} />
      <JsonLd data={breadcrumbLd(breadcrumb)} />
      <span className="hidden" data-canonical={absoluteUrl(`/tours/${tour.slug}`)} />
    </div>
  );
}

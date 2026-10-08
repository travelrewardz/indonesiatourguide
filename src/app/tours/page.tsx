import Link from "next/link";
import type { Metadata } from "next";
import TourCard from "@/components/TourCard";
import JsonLd from "@/components/JsonLd";
import { publishedDestinations, searchTours, tourCategories } from "@/lib/queries";
import { getDisplayCurrency, getLocale } from "@/lib/prefs";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Params = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const p = await searchParams;
  const destination = str(p.destination);
  const category = str(p.category);
  const q = str(p.q);
  const label = q ? `"${q}"` : category ?? destination ? `${category ?? ""} ${destination ? destination.replace(/-/g, " ") : ""}`.trim() : "";
  return buildMetadata({
    title: label ? `Tours ${label}` : "Indonesia Tours — Search & Book",
    description: `Search ${label || "Indonesia"} tours with live availability, real prices and instant booking. Filter by destination, duration, category and budget.`,
    path: "/tours",
  });
}

export default async function ToursPage({ searchParams }: { searchParams: Params }) {
  const p = await searchParams;
  const [currency, locale] = await Promise.all([getDisplayCurrency(), getLocale()]);
  const tr = (k: string) => t(locale, k);

  const filters = {
    q: str(p.q) || undefined,
    destination: str(p.destination) || undefined,
    category: str(p.category) || undefined,
    minDays: Number(str(p.minDays) || 0) || undefined,
    maxDays: Number(str(p.maxDays) || 0) || undefined,
    maxPrice: Number(str(p.maxPrice) || 0) || undefined,
    sort: str(p.sort) || "featured",
    page: Number(str(p.page) || 1) || 1,
    limit: 12,
  };

  const results = searchTours(filters);
  const destinations = publishedDestinations();
  const categories = tourCategories();
  const travelDate = str(p.date);
  const travelers = str(p.travelers);

  const pageLink = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === "string") params.set(k, v);
    }
    params.set("page", String(page));
    return `/tours?${params.toString()}`;
  };

  return (
    <div className="bg-gray-50">
      <div className="bg-ink py-10 text-white">
        <div className="container-x">
          <div className="text-sm text-white/60">
            <Link href="/" className="hover:text-accent">Home</Link> / Tours
          </div>
          <h1 className="font-display mt-2 text-3xl font-medium sm:text-4xl">
            {filters.destination
              ? `Tours in ${destinations.find((d) => d.slug === filters.destination)?.name ?? filters.destination}`
              : filters.category
                ? `${filters.category} tours in Indonesia`
                : "Search Indonesia tours"}
          </h1>
          <p className="mt-2 text-white/70">
            {results.total} tour{results.total === 1 ? "" : "s"} · live prices from verified local operators
          </p>
        </div>
      </div>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        {/* FILTERS */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <form method="get" className="card space-y-4 p-5">
            <div className="text-sm font-bold uppercase tracking-wide text-gray-500">Filter tours</div>

            <div>
              <label className="label" htmlFor="f-q">Keyword</label>
              <input id="f-q" name="q" defaultValue={filters.q ?? ""} className="input" placeholder="Bromo, snorkeling…" />
            </div>
            <div>
              <label className="label" htmlFor="f-dest">Destination</label>
              <select id="f-dest" name="destination" defaultValue={filters.destination ?? ""} className="input">
                <option value="">{tr("common.all")}</option>
                {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-cat">Category</label>
              <select id="f-cat" name="category" defaultValue={filters.category ?? ""} className="input">
                <option value="">{tr("common.all")}</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="f-min">Min days</label>
                <select id="f-min" name="minDays" defaultValue={filters.minDays ?? ""} className="input">
                  <option value="">—</option>
                  {[1, 2, 3, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-max">Max days</label>
                <select id="f-max" name="maxDays" defaultValue={filters.maxDays ?? ""} className="input">
                  <option value="">—</option>
                  {[1, 2, 3, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="f-price">Max price / person (USD)</label>
              <select id="f-price" name="maxPrice" defaultValue={filters.maxPrice ?? ""} className="input">
                <option value="">—</option>
                {[50, 100, 200, 400, 700, 1000, 2000].map((n) => <option key={n} value={n}>Up to ${n}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-sort">Sort by</label>
              <select id="f-sort" name="sort" defaultValue={filters.sort} className="input">
                <option value="featured">Featured</option>
                <option value="rating">Top rated</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="duration">Duration</option>
              </select>
            </div>
            {travelDate && <input type="hidden" name="date" value={travelDate} />}
            {travelers && <input type="hidden" name="travelers" value={travelers} />}
            <button type="submit" className="btn-primary w-full">{tr("common.search")}</button>
            <Link href="/tours" className="block text-center text-xs text-gray-500 hover:text-brand-600">Clear filters</Link>
          </form>

          <div className="card mt-5 p-5">
            <div className="text-sm font-bold uppercase tracking-wide text-gray-500">Popular styles</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link key={c} href={`/tours?category=${encodeURIComponent(c)}`}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium hover:border-brand-500 hover:text-brand-600">
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* RESULTS */}
        <section>
          {results.items.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl">🔍</div>
              <h2 className="mt-3 text-xl font-bold">No tours match those filters</h2>
              <p className="mt-2 text-sm text-gray-600">Try widening your search — or ask us for a tailor-made itinerary.</p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/tours" className="btn-outline">Clear filters</Link>
                <Link href="/contact?type=tailor_made" className="btn-primary">Plan my trip</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.items.map((tour) => (
                  <TourCard key={tour.id} tour={tour} currency={currency} />
                ))}
              </div>

              {results.totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                  {results.page > 1 && <Link href={pageLink(results.page - 1)} className="btn-outline btn-sm">← Prev</Link>}
                  {Array.from({ length: results.totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === results.totalPages || Math.abs(n - results.page) <= 2)
                    .map((n, i, arr) => (
                      <span key={n} className="flex items-center">
                        {i > 0 && arr[i - 1] !== n - 1 && <span className="px-1 text-gray-400">…</span>}
                        <Link href={pageLink(n)}
                          className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold ${n === results.page ? "bg-brand-600 text-white" : "border border-gray-200 hover:bg-gray-50"}`}>
                          {n}
                        </Link>
                      </span>
                    ))}
                  {results.page < results.totalPages && <Link href={pageLink(results.page + 1)} className="btn-outline btn-sm">Next →</Link>}
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Tours", path: "/tours" }])} />
    </div>
  );
}

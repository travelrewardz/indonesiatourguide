import { TOURS, DESTINATIONS, LANGUAGES, type TravelStyle } from "@/data/catalog";
import TourCard from "@/components/TourCard";

export const metadata = { title: "Tours" };

const STYLES: TravelStyle[] = [
  "Culture & Temples",
  "Adventure",
  "Beach & Islands",
  "Wildlife & Nature",
  "Culinary",
  "Honeymoon",
];

type Search = {
  q?: string;
  destination?: string;
  style?: string;
  language?: string;
  maxDays?: string;
  sort?: string;
};

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  let tours = [...TOURS];
  if (sp.q) {
    const needle = sp.q.toLowerCase();
    tours = tours.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        t.summary.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle) ||
        t.style.toLowerCase().includes(needle) ||
        t.destination.includes(needle)
    );
  }
  if (sp.destination)
    tours = tours.filter((t) => t.destination === sp.destination);
  if (sp.style) tours = tours.filter((t) => t.style === sp.style);
  if (sp.language)
    tours = tours.filter((t) => t.languages.includes(sp.language as never));
  if (sp.maxDays) tours = tours.filter((t) => t.days <= Number(sp.maxDays));

  switch (sp.sort) {
    case "price-asc":
      tours.sort((a, b) => a.retailPricePerPerson - b.retailPricePerPerson);
      break;
    case "price-desc":
      tours.sort((a, b) => b.retailPricePerPerson - a.retailPricePerPerson);
      break;
    case "duration":
      tours.sort((a, b) => a.days - b.days);
      break;
    default:
      tours.sort((a, b) => a.title.localeCompare(b.title));
  }

  const hasFilters = Boolean(
    sp.q || sp.destination || sp.style || sp.language || sp.maxDays || sp.sort
  );

  return (
    <div className="py-12">
      <div className="container-x">
        <h1 className="text-4xl font-black tracking-tight">
          {sp.q ? `Results for “${sp.q}”` : "All tours"}
        </h1>
        <p className="mt-2 text-gray-600">
          {tours.length} private journey{tours.length === 1 ? "" : "s"} across
          the Indonesian archipelago.
        </p>

        {/* FILTER BAR */}
        <form className="card mt-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label" htmlFor="destination">Destination</label>
            <select id="destination" name="destination" defaultValue={sp.destination ?? ""} className="input">
              <option value="">All destinations</option>
              {DESTINATIONS.map((d) => (
                <option key={d.slug} value={d.slug}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="style">Travel style</label>
            <select id="style" name="style" defaultValue={sp.style ?? ""} className="input">
              <option value="">All styles</option>
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="language">Guide language</label>
            <select id="language" name="language" defaultValue={sp.language ?? ""} className="input">
              <option value="">Any language</option>
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="maxDays">Max duration</label>
            <select id="maxDays" name="maxDays" defaultValue={sp.maxDays ?? ""} className="input">
              <option value="">Any length</option>
              <option value="5">Up to 5 days</option>
              <option value="7">Up to 7 days</option>
              <option value="9">Up to 9 days</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label" htmlFor="sort">Sort</label>
              <select id="sort" name="sort" defaultValue={sp.sort ?? ""} className="input">
                <option value="">Name (A–Z)</option>
                <option value="price-asc">Price (low → high)</option>
                <option value="price-desc">Price (high → low)</option>
                <option value="duration">Duration</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">Filter</button>
          </div>
        </form>

        {hasFilters && (
          <a
            href="/tours"
            className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            ✕ Clear all filters
          </a>
        )}

        {tours.length === 0 ? (
          <div className="card mt-10 p-10 text-center text-gray-600">
            No tours match those filters. Try widening your search.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

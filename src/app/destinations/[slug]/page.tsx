import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TourCard from "@/components/TourCard";
import JsonLd from "@/components/JsonLd";
import { destinationBySlug, toursByDestination, setting } from "@/lib/queries";
import { publishedDestinations } from "@/lib/queries";
import { getDisplayCurrency } from "@/lib/prefs";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }>, searchParams?: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const dest = destinationBySlug(slug);
  if (!dest) return buildMetadata({ title: "Destination not found", path: `/destinations/${slug}`, noIndex: true });
  return buildMetadata({
    title: dest.seo_title ?? `${dest.name} Tours`,
    description: dest.seo_description ?? dest.description ?? undefined,
    keywords: dest.seo_keywords,
    path: `/destinations/${dest.slug}`,
    image: dest.hero_image,
  });
}

export default async function DestinationPage({ params }: Ctx) {
  const { slug } = await params;
  const dest = destinationBySlug(slug);
  if (!dest) notFound();

  const currency = await getDisplayCurrency();
  const tours = toursByDestination(dest.slug, 24);
  const gallery: string[] = (() => {
    try {
      return JSON.parse(dest.gallery) as string[];
    } catch {
      return [];
    }
  })();
  const others = publishedDestinations().filter((d) => d.slug !== dest.slug).slice(0, 8);

  return (
    <div className="bg-white">
      <section className="relative h-72 sm:h-96">
        {dest.hero_image && <Image src={dest.hero_image} alt={dest.name} fill priority className="object-cover" sizes="100vw" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <div className="container-x relative flex h-full flex-col justify-end pb-8 text-white">
          <nav className="mb-2 text-sm text-white/70">
            <Link href="/" className="hover:text-accent">Home</Link> / <Link href="/destinations" className="hover:text-accent">Destinations</Link> / {dest.name}
          </nav>
          <div className="text-xs uppercase tracking-[0.25em] text-accent">{dest.tagline}</div>
          <h1 className="font-display mt-1 text-4xl font-medium sm:text-5xl">{dest.name}</h1>
          <p className="mt-1 text-white/75">{dest.region}</p>
        </div>
      </section>

      <div className="container-x py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="text-lg leading-8 text-gray-700" dangerouslySetInnerHTML={{ __html: paragraphs(dest.description ?? "") }} />

            <section className="mt-10">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-2xl font-medium">Tours in {dest.name}</h2>
                <span className="text-sm text-gray-500">{tours.length} available</span>
              </div>
              {tours.length ? (
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {tours.map((t) => <TourCard key={t.id} tour={t} currency={currency} />)}
                </div>
              ) : (
                <div className="mt-6 card p-8 text-center text-sm text-gray-600">
                  New tours are being added for {dest.name}.{" "}
                  <Link href={`/contact?type=tailor_made&destination=${dest.slug}`} className="font-semibold text-brand-600 hover:underline">
                    Ask for a tailor-made trip →
                  </Link>
                </div>
              )}
            </section>

            {gallery.length > 1 && (
              <section className="mt-12">
                <h2 className="font-display text-2xl font-medium">{dest.name} in pictures</h2>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.slice(0, 6).map((img, i) => (
                    <div key={img} className={`relative overflow-hidden rounded-xl ${i === 0 ? "col-span-2 row-span-2 h-64 sm:h-72" : "h-32 sm:h-36"}`}>
                      <Image src={img} alt={`${dest.name} — photo ${i + 1}`} fill className="object-cover" sizes="(max-width:640px) 50vw, 33vw" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="card p-6">
              <h2 className="font-bold">Plan a {dest.name} trip</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Tell us your dates and we&apos;ll build a day-by-day itinerary with transparent pricing.
              </p>
              <Link href={`/contact?type=tailor_made&destination=${dest.slug}`} className="btn-primary mt-4 w-full">Plan my trip</Link>
              <a href={`https://wa.me/${setting("whatsapp_number", "6281234567890")}?text=${encodeURIComponent(`Hello, I'm interested in a ${dest.name} trip.`)}`}
                target="_blank" rel="noopener noreferrer" className="btn-outline mt-2 w-full border-green-500 text-green-700 hover:bg-green-50">
                💬 WhatsApp us
              </a>
            </div>

            <div className="card p-6">
              <h2 className="font-bold">Other destinations</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {others.map((d) => (
                  <Link key={d.slug} href={`/destinations/${d.slug}`}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium hover:border-brand-500 hover:text-brand-600">
                    {d.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }, { name: dest.name, path: `/destinations/${dest.slug}` },
      ])} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        name: dest.name,
        description: dest.description ?? undefined,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/destinations/${dest.slug}`,
        image: dest.hero_image ?? undefined,
      }} />
    </div>
  );
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p class="my-4 leading-8 text-gray-700">${p.trim()}</p>`)
    .join("");
}

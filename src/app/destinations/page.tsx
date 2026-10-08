import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { publishedDestinations } from "@/lib/queries";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Indonesia Destinations — Bali, Java, Komodo, Lombok & Beyond",
  description:
    "Explore Indonesia destination guides with tours, itineraries and local experts — Bali, Yogyakarta, Bromo, Ijen, Komodo, Flores, Lombok, Sulawesi, Sumatra and Raja Ampat.",
  path: "/destinations",
});

export default function DestinationsPage() {
  const destinations = publishedDestinations();
  const counts = new Map(
    all<{ slug: string; c: number }>(
      `SELECT d.slug, COUNT(t.id) AS c FROM destinations d LEFT JOIN tours t ON t.destination_id = d.id AND t.status = 'PUBLISHED' GROUP BY d.id`,
    ).map((r) => [r.slug, r.c]),
  );

  return (
    <div className="bg-gray-50">
      <div className="bg-ink py-12 text-white">
        <div className="container-x">
          <div className="text-sm text-white/60"><Link href="/" className="hover:text-accent">Home</Link> / Destinations</div>
          <h1 className="font-display mt-2 text-4xl font-medium">Choose your Indonesia</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Seventeen thousand islands — here are the regions our local operators know best.
          </p>
        </div>
      </div>

      <div className="container-x py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <Link key={d.slug} href={`/destinations/${d.slug}`} className="group relative h-72 overflow-hidden rounded-2xl">
              {d.hero_image && (
                <Image src={d.hero_image} alt={d.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="text-xs uppercase tracking-widest text-sand-200">{d.tagline}</div>
                <div className="mt-1 text-2xl font-bold">{d.name}</div>
                <p className="mt-1 line-clamp-2 text-sm text-white/80">{d.description}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {counts.get(d.slug) ?? 0} tours →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Destinations", path: "/destinations" }])} />
    </div>
  );
}

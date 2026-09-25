import Image from "next/image";
import Link from "next/link";
import { DESTINATIONS, TOURS } from "@/data/catalog";

export const metadata = { title: "Destinations" };

export default function DestinationsPage() {
  return (
    <div className="py-12">
      <div className="container-x">
        <h1 className="text-4xl font-black tracking-tight">
          Destinations across the archipelago
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Eight regions, each with licensed local guides and hand-built
          itineraries. Every tour runs private with flexible departure dates.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((d) => {
            const count = TOURS.filter((t) => t.destination === d.slug).length;
            return (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className="group relative h-72 overflow-hidden rounded-2xl"
              >
                <Image
                  src={d.image}
                  alt={d.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <div className="text-xs uppercase tracking-widest text-sand-200">
                    {d.tagline}
                  </div>
                  <div className="mt-1 text-2xl font-bold">{d.name}</div>
                  <div className="mt-1 text-sm text-white/85">
                    {count} tour{count === 1 ? "" : "s"} available
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

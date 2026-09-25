import Link from "next/link";
import Image from "next/image";
import type { Tour } from "@/data/catalog";
import { LANGUAGES } from "@/data/catalog";
import { formatUSD } from "@/lib/format";

export default function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
    >
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
          {tour.days} days · {tour.nights} nights
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {tour.style}
        </div>
        <h3 className="mt-1 text-lg font-bold leading-snug">{tour.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{tour.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {tour.languages.slice(0, 5).map((l) => (
            <span key={l} className="badge bg-sand-100 text-brand-800">
              {LANGUAGES[l]}
            </span>
          ))}
          {tour.languages.length > 5 && (
            <span className="badge bg-gray-100 text-gray-600">
              +{tour.languages.length - 5}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              From / person
            </div>
            <div className="text-lg font-bold text-brand-700">
              {formatUSD(tour.retailPricePerPerson)}
            </div>
          </div>
          <span className="text-sm font-semibold text-brand-600 group-hover:underline">
            View itinerary →
          </span>
        </div>
      </div>
    </Link>
  );
}

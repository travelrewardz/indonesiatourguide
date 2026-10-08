import Link from "next/link";
import Image from "next/image";
import { cx } from "@/lib/format";
import { displayMoney } from "@/lib/currency";
import type { TourCardData } from "@/lib/queries";

export default function TourCard({
  tour, currency = "USD", badge,
}: {
  tour: TourCardData;
  currency?: string;
  badge?: string;
}) {
  const from = (tour.sale_price && tour.sale_price > 0 ? tour.sale_price : tour.base_price) as number;
  const optionFrom = tour.option_from != null && tour.option_from > 0 ? tour.option_from : null;
  const listPrice = tour.base_price;
  const price = Math.min(from, optionFrom ?? from);
  const hasDiscount = tour.sale_price != null && tour.sale_price > 0 && tour.sale_price < tour.base_price;
  const soldOut = (tour.review_count ?? 0) >= 0 && false; // availability is resolved on the detail page

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
      data-analytics="tour_view"
    >
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        {tour.image_url ? (
          <Image
            src={tour.image_url}
            alt={tour.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">🏝️</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {tour.duration_days === 1 ? "Day tour" : `${tour.duration_days} days`}
        </span>
        {hasDiscount && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">
            {Math.round((1 - (tour.sale_price as number) / tour.base_price) * 100)}% off
          </span>
        )}
        {badge && (
          <span className="absolute bottom-3 left-3 rounded-full bg-brand-600/95 px-2.5 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-brand-600">
          <span>{tour.destination_name ?? tour.region}</span>
          {tour.category && <span className="text-gray-400">{tour.category}</span>}
        </div>
        <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug">{tour.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{tour.short_description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span>⏱ {tour.duration_text ?? `${tour.duration_days} day(s)`}</span>
          {tour.rating > 0 && (
            <span className="flex items-center gap-1 font-medium text-ink">
              <span className="text-accent">★</span> {tour.rating.toFixed(1)}
              <span className="text-gray-400">({tour.review_count})</span>
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">From / person</div>
            <div className="flex items-baseline gap-2">
              <span className={cx("text-lg font-bold", hasDiscount ? "text-accent" : "text-brand-700")}>
                {displayMoney(price, currency)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">{displayMoney(listPrice, currency)}</span>
              )}
            </div>
          </div>
          <span className={cx("text-sm font-semibold text-brand-600 group-hover:underline", soldOut && "opacity-50")}>
            {soldOut ? "Sold out" : "Book now →"}
          </span>
        </div>
      </div>
    </Link>
  );
}

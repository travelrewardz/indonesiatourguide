import { get, all } from "@/lib/db";
import type { Tour, TourImage, TourItineraryItem, TourOption } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const tour = get<Tour>("SELECT * FROM tours WHERE slug = ?", slug);
  if (!tour || tour.status !== "PUBLISHED") {
    return Response.json({ error: "Tour not found" }, { status: 404 });
  }
  const images = all<TourImage>("SELECT * FROM tour_images WHERE tour_id = ? ORDER BY sort_order", tour.id);
  const itinerary = all<TourItineraryItem>("SELECT * FROM tour_itinerary WHERE tour_id = ? ORDER BY sort_order, day", tour.id);
  const options = all<TourOption>("SELECT * FROM tour_options WHERE tour_id = ? ORDER BY sort_order", tour.id);
  const destination = tour.destination_id
    ? get<{ name: string; slug: string }>("SELECT name, slug FROM destinations WHERE id = ?", tour.destination_id)
    : undefined;
  return Response.json({ tour, images, itinerary, options, destination });
}

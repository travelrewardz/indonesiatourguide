import { NextRequest } from "next/server";
import { all } from "@/lib/db";
import { getTourBySlug, getOptions } from "@/lib/pricing";
import { listAvailability } from "@/lib/availability";
import type { TourOption } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tours/[slug]/availability?optionId=&days=30 — starts today. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const tour = getTourBySlug(slug);
  if (!tour || tour.status !== "PUBLISHED") return Response.json({ error: "Tour not found" }, { status: 404 });

  const optionId = req.nextUrl.searchParams.get("optionId");
  const days = Math.min(120, Math.max(1, Number(req.nextUrl.searchParams.get("days") || 30)));
  const options = getOptions(tour.id);
  const option: TourOption | null = optionId ? options.find((o) => o.id === optionId) ?? null : null;
  const today = new Date().toISOString().slice(0, 10);
  return Response.json({ tour: tour.slug, option: option?.id ?? null, dates: listAvailability(tour, option, today, days) });
}

import { NextRequest } from "next/server";
import { get, all } from "@/lib/db";
import { getTourBySlug, getOptions, computePrice } from "@/lib/pricing";
import { getAvailabilityForDate } from "@/lib/availability";
import { getSessionUser } from "@/lib/auth";
import { convert } from "@/lib/currency";
import type { TourOption } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tours/[slug]/quote?optionId=&date=&pax=2
 * Returns the authoritative price (computed server-side) + date availability.
 * The checkout form always re-requests this — client numbers are never trusted.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const tour = getTourBySlug(slug);
  if (!tour || tour.status !== "PUBLISHED") return Response.json({ error: "Tour not found" }, { status: 404 });

  const p = req.nextUrl.searchParams;
  const date = p.get("date") || new Date().toISOString().slice(0, 10);
  const pax = Math.min(50, Math.max(1, Number(p.get("pax") || 1)));
  const optionId = p.get("optionId") || null;
  const displayCurrency = (p.get("currency") || "USD").toUpperCase();

  const options = getOptions(tour.id);
  const option: TourOption | null = optionId ? options.find((o) => o.id === optionId) ?? null : null;

  let role: "PUBLIC" | "AGENT" = "PUBLIC";
  let commissionPct = 0;
  const user = await getSessionUser();
  if (user?.role === "TRAVEL_AGENT") {
    const agent = get<{ status: string; commission_pct: number }>(
      "SELECT status, commission_pct FROM agents WHERE user_id = ?", user.id,
    );
    if (agent?.status === "APPROVED") {
      role = "AGENT";
      commissionPct = agent.commission_pct;
    }
  }

  const pricing = computePrice({ tour, option, date, pax, role, commissionPct });
  const availability = getAvailabilityForDate(tour, option, date);
  const rules = all<{ date_from: string; date_to: string; price: number; label: string | null }>(
    "SELECT date_from, date_to, price, label FROM price_rules WHERE tour_id = ? ORDER BY date_from", tour.id,
  );

  return Response.json({
    tour: tour.slug,
    option: option?.id ?? null,
    date,
    pax,
    role,
    pricing,
    display: {
      currency: displayCurrency,
      unit: convert(pricing.unitPrice, displayCurrency),
      total: convert(pricing.total, displayCurrency),
      discount: convert(pricing.discount, displayCurrency),
    },
    options: options.map((o) => ({ id: o.id, price: convert(o.price, displayCurrency) })),
    availability,
    seasonalRules: rules,
    canBook: availability.status === "AVAILABLE" || availability.status === "LIMITED",
  });
}

import { NextRequest } from "next/server";
import { all, get, run, nowIso } from "@/lib/db";
import { requireApi, isSameOriginRequest } from "@/lib/auth";
import { saveTour } from "@/lib/tours-write";
import type { Tour } from "@/lib/types";

export const runtime = "nodejs";

function canManage(role: string, userId: string, supplierId: string | null): boolean {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
  if (role !== "SUPPLIER" || !supplierId) return false;
  const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", userId);
  return !!supplier && supplier.id === supplierId;
}

/** GET /api/tours/[id] — full tour payload for the editor (owner/admin only). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireApi(["ADMIN", "SUPER_ADMIN", "SUPPLIER"]);
  if (auth instanceof Response) return auth;

  const tour = get<Tour>("SELECT * FROM tours WHERE id = ?", id);
  if (!tour) return Response.json({ error: "Tour not found" }, { status: 404 });
  if (!canManage(auth.role, auth.id, tour.supplier_id)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const images = all<{ image_url: string; alt_text: string | null }>(
    "SELECT image_url, alt_text FROM tour_images WHERE tour_id = ? ORDER BY sort_order", id,
  );
  const itinerary = all<{ day: number; time: string | null; title: string; description: string | null }>(
    "SELECT day, time, title, description FROM tour_itinerary WHERE tour_id = ? ORDER BY sort_order", id,
  );
  const options = all<{
    id: string; name: string; description: string | null; price: number; min_pax: number; max_pax: number;
    duration_text: string | null; inclusions: string; exclusions: string; is_available: number;
  }>("SELECT * FROM tour_options WHERE tour_id = ? ORDER BY sort_order", id);
  const tiers = all<{ option_id: string; label: string | null; min_pax: number; max_pax: number | null; price: number }>(
    "SELECT option_id, label, min_pax, max_pax, price FROM tour_price_tiers WHERE tour_id = ? ORDER BY option_id, min_pax",
    id,
  );

  const parse = <T,>(raw: string, fallback: T): T => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };
  const destination = tour.destination_id
    ? get<{ slug: string }>("SELECT slug FROM destinations WHERE id = ?", tour.destination_id)
    : undefined;

  return Response.json({
    tour: {
      ...tour,
      destination_slug: destination?.slug ?? "",
      destinations: parse<string[]>(tour.destinations, destination?.slug ? [destination.slug] : []),
      regions: parse<string[]>(tour.regions, tour.region ? [tour.region] : []),
      categories: parse<string[]>(tour.categories, tour.category ? [tour.category] : []),
      highlights: parse<string[]>(tour.highlights, []),
      includes: parse<string[]>(tour.includes, []),
      excludes: parse<string[]>(tour.excludes, []),
      faqs: parse<{ q: string; a: string }[]>(tour.faqs, []),
      featured: !!tour.featured,
    },
    images,
    itinerary,
    tiers: tiers.filter((t) => t.option_id === ""),
    options: options.map((o) => ({
      ...o,
      is_available: !!o.is_available,
      inclusions: parse<string[]>(o.inclusions, []),
      exclusions: parse<string[]>(o.exclusions, []),
      tiers: tiers.filter((t) => t.option_id === o.id),
    })),
  });
}

/** PUT /api/tours/[id] — update (owner supplier or admin). */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireApi(["ADMIN", "SUPER_ADMIN", "SUPPLIER"]);
  if (auth instanceof Response) return auth;
  if (!(await isSameOriginRequest(req))) return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });

  const tour = get<Tour>("SELECT * FROM tours WHERE id = ?", id);
  if (!tour) return Response.json({ error: "Tour not found" }, { status: 404 });
  if (!canManage(auth.role, auth.id, tour.supplier_id)) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const result = await saveTour(body, {
    tourId: id,
    supplierId: tour.supplier_id,
    allowSupplierChoice: auth.role === "ADMIN" || auth.role === "SUPER_ADMIN",
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true, id: result.id, slug: result.slug });
}

/** DELETE /api/tours/[id] — admin only (bookings history preserved via FK rules). */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await requireApi(["ADMIN", "SUPER_ADMIN"]);
  if (auth instanceof Response) return auth;
  run("DELETE FROM tours WHERE id = ?", id);
  return Response.json({ ok: true, deletedAt: nowIso() });
}

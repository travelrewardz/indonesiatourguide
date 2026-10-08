import { NextRequest } from "next/server";
import { all, get } from "@/lib/db";
import type { Tour } from "@/lib/types";
import { requireApi, isSameOriginRequest } from "@/lib/auth";
import { saveTour } from "@/lib/tours-write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public tour search API (also used by the mobile/partner integrations).
 * GET /api/tours?q=&destination=&category=&region=&minDays=&maxDays=&minPrice=&maxPrice=&date=&travelers=&sort=&page=&limit=
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = p.get("q")?.trim();
  const destination = p.get("destination");
  const category = p.get("category");
  const region = p.get("region");
  const minDays = Number(p.get("minDays") || 0);
  const maxDays = Number(p.get("maxDays") || 0);
  const minPrice = Number(p.get("minPrice") || 0);
  const maxPrice = Number(p.get("maxPrice") || 0);
  const sort = p.get("sort") || "featured";
  const page = Math.max(1, Number(p.get("page") || 1));
  const limit = Math.min(60, Math.max(1, Number(p.get("limit") || 12)));

  const where: string[] = ["t.status = 'PUBLISHED'"];
  const params: (string | number)[] = [];

  if (q) {
    where.push("(t.title LIKE ? OR t.short_description LIKE ? OR t.region LIKE ? OR d.name LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (destination) {
    where.push("d.slug = ?");
    params.push(destination);
  }
  if (category) {
    where.push("t.category = ?");
    params.push(category);
  }
  if (region) {
    where.push("t.region LIKE ?");
    params.push(`%${region}%`);
  }
  if (minDays) {
    where.push("t.duration_days >= ?");
    params.push(minDays);
  }
  if (maxDays) {
    where.push("t.duration_days <= ?");
    params.push(maxDays);
  }
  if (minPrice) {
    where.push("COALESCE(t.sale_price, t.base_price) >= ?");
    params.push(minPrice);
  }
  if (maxPrice) {
    where.push("COALESCE(t.sale_price, t.base_price) <= ?");
    params.push(maxPrice);
  }

  const orderBy =
    sort === "price_asc" ? "COALESCE(t.sale_price, t.base_price) ASC" :
    sort === "price_desc" ? "COALESCE(t.sale_price, t.base_price) DESC" :
    sort === "rating" ? "t.rating DESC, t.review_count DESC" :
    sort === "duration" ? "t.duration_days ASC" :
    "t.featured DESC, t.rating DESC";

  const whereSql = where.join(" AND ");
  const totalRow = get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM tours t LEFT JOIN destinations d ON d.id = t.destination_id WHERE ${whereSql}`,
    ...params,
  );
  const offset = (page - 1) * limit;
  const items = all<Tour & { destination_name: string | null; destination_slug: string | null }>(
    `SELECT t.*, d.name AS destination_name, d.slug AS destination_slug
     FROM tours t LEFT JOIN destinations d ON d.id = t.destination_id
     WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    ...params, limit, offset,
  );

  return Response.json({
    total: totalRow?.c ?? 0,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil((totalRow?.c ?? 0) / limit)),
    items,
  });
}

/** POST /api/tours — create a tour (admin: any supplier; supplier: own catalogue). */
export async function POST(req: NextRequest) {
  const auth = await requireApi(["ADMIN", "SUPER_ADMIN", "SUPPLIER"]);
  if (auth instanceof Response) return auth;
  if (!(await isSameOriginRequest(req))) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  let supplierId: string | null = null;
  let allowSupplierChoice = false;
  if (auth.role === "SUPPLIER") {
    const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", auth.id);
    if (!supplier) return Response.json({ error: "Supplier profile not found" }, { status: 403 });
    supplierId = supplier.id;
  } else {
    allowSupplierChoice = true;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const result = await saveTour(body, { supplierId, allowSupplierChoice });
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true, id: result.id, slug: result.slug }, { status: 201 });
}

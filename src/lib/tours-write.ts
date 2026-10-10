import { get, run, newId, nowIso, tx } from "./db";
import { slugify } from "./format";
import { tourSchema } from "./validation";
import type { z } from "zod";

type TierInput = { label?: string; min_pax: number; max_pax?: number | null; price: number };

function parseList(raw: string | null | undefined): string[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

/** De-duplicates, trims and drops empty entries from a multi-value field. */
function cleanList(v: string[] | undefined): string[] {
  return Array.from(new Set((v ?? []).map((s) => s.trim()).filter(Boolean)));
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    const v = JSON.parse(raw || "null");
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Creates or updates a tour with images, itinerary, options and tiers (admin/supplier). */
export async function saveTour(
  input: unknown,
  opts: { tourId?: string; supplierId?: string | null; allowSupplierChoice?: boolean },
): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  const parsed = tourSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid tour data" };
  const d = parsed.data;

  let slug = d.slug ? slugify(d.slug) : slugify(d.title);
  if (!slug) slug = `tour-${Date.now().toString(36)}`;
  const clash = get<{ id: string }>("SELECT id FROM tours WHERE slug = ?", slug);
  if (clash && clash.id !== opts.tourId) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  let supplierId = opts.supplierId ?? null;
  if (opts.allowSupplierChoice && d.supplier_id) supplierId = d.supplier_id || null;

  const existing = opts.tourId
    ? get<{
        id: string;
        destination_id: string | null;
        destinations: string;
        regions: string;
        categories: string;
        currency: string;
        agent_discount_pct: number | null;
        short_description: string | null;
        full_description: string | null;
        duration_text: string | null;
        difficulty: string | null;
        sale_price: number | null;
        agent_price: number | null;
        status: string;
        featured: number;
        pickup_info: string | null;
        map_lat: number | null;
        map_lng: number | null;
        seo_title: string | null;
        seo_description: string | null;
        seo_keywords: string | null;
        highlights: string;
        includes: string;
        excludes: string;
        faqs: string;
      }>("SELECT * FROM tours WHERE id = ?", opts.tourId)
    : undefined;
  if (opts.tourId && !existing) return { ok: false, error: "Tour not found" };

  // PATCH semantics: a field the payload omits keeps its stored value.
  const keep = <T,>(v: T | undefined | "", cur: T | null | undefined): T | null =>
    v === undefined ? (cur ?? null) : (v as T) || null;

  // ------------------------------------------------------- attribute resolution
  // Multi-value arrays win when present; otherwise a legacy single-value field
  // wins when present (old partial payloads); otherwise existing rows survive —
  // partial updates (e.g. the E2E suite) must not wipe what they don't mention.
  let destSlugs: string[] | undefined;
  if (d.destinations !== undefined) {
    destSlugs = cleanList(d.destinations);
  } else if (d.destination_slug) {
    destSlugs = [d.destination_slug.trim()];
  } else if (existing) {
    const primary = existing.destination_id
      ? get<{ slug: string }>("SELECT slug FROM destinations WHERE id = ?", existing.destination_id)?.slug
      : undefined;
    destSlugs = primary ? [primary] : [];
  }

  const regions = d.regions !== undefined ? cleanList(d.regions) : undefined;
  const categories = d.categories !== undefined ? cleanList(d.categories) : undefined;

  const finalDestinations = destSlugs ?? parseList(existing?.destinations);
  const finalRegions =
    regions ?? (d.region !== undefined ? (d.region ? [d.region.trim()] : []) : parseList(existing?.regions));
  const finalCategories =
    categories ?? (d.category !== undefined ? (d.category ? [d.category.trim()] : []) : parseList(existing?.categories));

  // Legacy single columns always mirror the first entry of the corresponding array.
  const primaryDestSlug = finalDestinations[0];
  const destination = primaryDestSlug
    ? get<{ id: string }>("SELECT id FROM destinations WHERE slug = ?", primaryDestSlug)
    : undefined;
  const region = finalRegions[0] ?? null;
  const category = finalCategories[0] ?? null;

  // Currency: explicit payload always wins. On create the supplier's preferred
  // currency applies; on update the tour keeps its own currency so changing the
  // profile preference never silently reprices existing inventory.
  const preferred = supplierId
    ? get<{ preferred_currency: string }>("SELECT preferred_currency FROM suppliers WHERE id = ?", supplierId)
        ?.preferred_currency
    : undefined;
  const currency = (d.currency || existing?.currency || preferred || "USD").toUpperCase();
  // Undefined keeps the stored percentage; null clears it (no agent discount).
  const agentDiscountPct = d.agent_discount_pct === undefined ? existing?.agent_discount_pct ?? null : d.agent_discount_pct;

  const now = nowIso();

  return tx(() => {
    let tourId = opts.tourId ?? "";
    const fields = {
      title: d.title,
      slug,
      short_description: keep(d.short_description, existing?.short_description),
      full_description: keep(d.full_description, existing?.full_description),
      destination_id: destination?.id ?? null,
      destinations: JSON.stringify(finalDestinations),
      regions: JSON.stringify(finalRegions),
      categories: JSON.stringify(finalCategories),
      region,
      duration_days: d.duration_days,
      duration_text: keep(d.duration_text, existing?.duration_text),
      category,
      difficulty: keep(d.difficulty, existing?.difficulty),
      min_pax: d.min_pax,
      max_pax: d.max_pax,
      base_price: d.base_price,
      sale_price: d.sale_price !== undefined ? d.sale_price : existing?.sale_price ?? null,
      currency,
      agent_price: d.agent_price !== undefined ? d.agent_price : existing?.agent_price ?? null,
      agent_discount_pct: agentDiscountPct,
      supplier_id: supplierId,
      status: d.status ?? existing?.status ?? "DRAFT",
      featured: d.featured !== undefined ? (d.featured ? 1 : 0) : existing?.featured ?? 0,
      highlights: JSON.stringify(d.highlights ?? parseJson<string[]>(existing?.highlights, [])),
      includes: JSON.stringify(d.includes ?? parseJson<string[]>(existing?.includes, [])),
      excludes: JSON.stringify(d.excludes ?? parseJson<string[]>(existing?.excludes, [])),
      pickup_info: keep(d.pickup_info, existing?.pickup_info),
      faqs: JSON.stringify(d.faqs ?? parseJson<{ q: string; a: string }[]>(existing?.faqs, [])),
      map_lat: d.map_lat !== undefined ? d.map_lat : existing?.map_lat ?? null,
      map_lng: d.map_lng !== undefined ? d.map_lng : existing?.map_lng ?? null,
      seo_title: keep(d.seo_title, existing?.seo_title),
      seo_description: keep(d.seo_description, existing?.seo_description),
      seo_keywords: keep(d.seo_keywords, existing?.seo_keywords),
      updated_at: now,
    };

    if (opts.tourId) {
      run(
        `UPDATE tours SET title = ?, slug = ?, short_description = ?, full_description = ?, destination_id = ?,
          destinations = ?, regions = ?, categories = ?, region = ?,
          duration_days = ?, duration_text = ?, category = ?, difficulty = ?, min_pax = ?, max_pax = ?, base_price = ?,
          sale_price = ?, currency = ?, agent_price = ?, agent_discount_pct = ?, supplier_id = ?, status = ?, featured = ?,
          highlights = ?, includes = ?, excludes = ?, pickup_info = ?, faqs = ?, map_lat = ?, map_lng = ?,
          seo_title = ?, seo_description = ?, seo_keywords = ?, updated_at = ? WHERE id = ?`,
        fields.title, fields.slug, fields.short_description, fields.full_description, fields.destination_id,
        fields.destinations, fields.regions, fields.categories, fields.region,
        fields.duration_days, fields.duration_text, fields.category, fields.difficulty, fields.min_pax,
        fields.max_pax, fields.base_price, fields.sale_price, fields.currency, fields.agent_price,
        fields.agent_discount_pct, fields.supplier_id, fields.status, fields.featured, fields.highlights,
        fields.includes, fields.excludes, fields.pickup_info, fields.faqs, fields.map_lat, fields.map_lng,
        fields.seo_title, fields.seo_description, fields.seo_keywords, fields.updated_at,
        opts.tourId,
      );
    } else {
      tourId = newId("tr");
      run(
        `INSERT INTO tours (id, title, slug, short_description, full_description, destination_id, destinations,
          regions, categories, region, duration_days, duration_text, category, difficulty, min_pax, max_pax,
          base_price, sale_price, currency, agent_price, agent_discount_pct, supplier_id, rating, review_count,
          status, featured, highlights, includes, excludes, pickup_info, faqs, map_lat, map_lng, seo_title,
          seo_description, seo_keywords, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tourId, fields.title, fields.slug, fields.short_description, fields.full_description, fields.destination_id,
        fields.destinations, fields.regions, fields.categories, fields.region,
        fields.duration_days, fields.duration_text, fields.category, fields.difficulty, fields.min_pax,
        fields.max_pax, fields.base_price, fields.sale_price, fields.currency, fields.agent_price,
        fields.agent_discount_pct, fields.supplier_id, fields.status, fields.featured, fields.highlights,
        fields.includes, fields.excludes, fields.pickup_info, fields.faqs, fields.map_lat, fields.map_lng,
        fields.seo_title, fields.seo_description, fields.seo_keywords, now, now,
      );
    }

    // images — only rewritten when the payload mentions them
    if (d.images !== undefined) {
      run("DELETE FROM tour_images WHERE tour_id = ?", tourId);
      d.images.forEach((img, i) => {
        run(
          "INSERT INTO tour_images (id, tour_id, image_url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)",
          newId("img"), tourId, img.image_url, img.alt_text || d.title, i,
        );
      });
    }

    // itinerary — only rewritten when the payload mentions them
    if (d.itinerary !== undefined) {
      run("DELETE FROM tour_itinerary WHERE tour_id = ?", tourId);
      d.itinerary.forEach((item, i) => {
        run(
          "INSERT INTO tour_itinerary (id, tour_id, day, time, title, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
          newId("itr"), tourId, item.day, item.time || null, item.title, item.description || null, i,
        );
      });
    }

    const insertTier = (t: TierInput, optionId: string, sort: number) => {
      run(
        "INSERT INTO tour_price_tiers (id, tour_id, option_id, label, min_pax, max_pax, price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        newId("tir"), tourId, optionId, t.label || null, t.min_pax, t.max_pax ?? null, t.price, sort,
      );
    };

    // options — rewritten wholesale when present, so their tiers follow the
    // fresh option ids; an omitted options array keeps the stored rows intact.
    if (d.options !== undefined) {
      run("DELETE FROM tour_price_tiers WHERE tour_id = ? AND option_id <> ''", tourId);
      run("DELETE FROM tour_options WHERE tour_id = ?", tourId);
      d.options.forEach((o, i) => {
        const optionId = newId("opt");
        run(
          `INSERT INTO tour_options (id, tour_id, name, description, price, min_pax, max_pax, duration_text, inclusions, exclusions, is_available, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          optionId, tourId, o.name, o.description || null, o.price, o.min_pax, o.max_pax, o.duration_text || null,
          JSON.stringify(o.inclusions), JSON.stringify(o.exclusions), o.is_available ? 1 : 0, i,
        );
        [...o.tiers].sort((a, b) => a.min_pax - b.min_pax).forEach((t, j) => insertTier(t, optionId, j));
      });
    }

    // tour-level tier ladder — only replaced when the payload mentions it, so
    // partial updates (without `tiers`) keep the existing ladder intact.
    if (d.tiers !== undefined) {
      run("DELETE FROM tour_price_tiers WHERE tour_id = ? AND option_id = ''", tourId);
      [...d.tiers].sort((a, b) => a.min_pax - b.min_pax).forEach((t, j) => insertTier(t, "", j));
    }

    return { ok: true as const, id: tourId, slug };
  });
}

export type TourSaveInput = z.infer<typeof tourSchema>;

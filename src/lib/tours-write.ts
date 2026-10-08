import { get, run, newId, nowIso, tx } from "./db";
import { slugify } from "./format";
import { tourSchema } from "./validation";
import type { z } from "zod";

/** Creates or updates a tour with images, itinerary and options (admin/supplier). */
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

  const destination = d.destination_slug
    ? get<{ id: string }>("SELECT id FROM destinations WHERE slug = ?", d.destination_slug)
    : undefined;

  let supplierId = opts.supplierId ?? null;
  if (opts.allowSupplierChoice && d.supplier_id) supplierId = d.supplier_id || null;

  const now = nowIso();

  return tx(() => {
    let tourId = opts.tourId ?? "";
    const fields = {
      title: d.title,
      slug,
      short_description: d.short_description || null,
      full_description: d.full_description || null,
      destination_id: destination?.id ?? null,
      region: d.region || null,
      duration_days: d.duration_days,
      duration_text: d.duration_text || null,
      category: d.category || null,
      difficulty: d.difficulty || null,
      min_pax: d.min_pax,
      max_pax: d.max_pax,
      base_price: d.base_price,
      sale_price: d.sale_price ?? null,
      currency: "USD",
      agent_price: d.agent_price ?? null,
      supplier_id: supplierId,
      status: d.status,
      featured: d.featured ? 1 : 0,
      highlights: JSON.stringify(d.highlights),
      includes: JSON.stringify(d.includes),
      excludes: JSON.stringify(d.excludes),
      pickup_info: d.pickup_info || null,
      faqs: JSON.stringify(d.faqs),
      map_lat: d.map_lat ?? null,
      map_lng: d.map_lng ?? null,
      seo_title: d.seo_title || null,
      seo_description: d.seo_description || null,
      seo_keywords: d.seo_keywords || null,
      updated_at: now,
    };

    if (opts.tourId) {
      const existing = get<{ id: string }>("SELECT id FROM tours WHERE id = ?", opts.tourId);
      if (!existing) return { ok: false, error: "Tour not found" } as const;
      run(
        `UPDATE tours SET title = ?, slug = ?, short_description = ?, full_description = ?, destination_id = ?, region = ?,
          duration_days = ?, duration_text = ?, category = ?, difficulty = ?, min_pax = ?, max_pax = ?, base_price = ?,
          sale_price = ?, currency = ?, agent_price = ?, supplier_id = ?, status = ?, featured = ?, highlights = ?,
          includes = ?, excludes = ?, pickup_info = ?, faqs = ?, map_lat = ?, map_lng = ?, seo_title = ?,
          seo_description = ?, seo_keywords = ?, updated_at = ? WHERE id = ?`,
        fields.title, fields.slug, fields.short_description, fields.full_description, fields.destination_id, fields.region,
        fields.duration_days, fields.duration_text, fields.category, fields.difficulty, fields.min_pax, fields.max_pax,
        fields.base_price, fields.sale_price, fields.currency, fields.agent_price, fields.supplier_id, fields.status,
        fields.featured, fields.highlights, fields.includes, fields.excludes, fields.pickup_info, fields.faqs,
        fields.map_lat, fields.map_lng, fields.seo_title, fields.seo_description, fields.seo_keywords, fields.updated_at,
        opts.tourId,
      );
    } else {
      tourId = newId("tr");
      run(
        `INSERT INTO tours (id, title, slug, short_description, full_description, destination_id, region, duration_days,
          duration_text, category, difficulty, min_pax, max_pax, base_price, sale_price, currency, agent_price,
          supplier_id, rating, review_count, status, featured, highlights, includes, excludes, pickup_info, faqs,
          map_lat, map_lng, seo_title, seo_description, seo_keywords, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tourId, fields.title, fields.slug, fields.short_description, fields.full_description, fields.destination_id,
        fields.region, fields.duration_days, fields.duration_text, fields.category, fields.difficulty, fields.min_pax,
        fields.max_pax, fields.base_price, fields.sale_price, fields.currency, fields.agent_price, fields.supplier_id,
        fields.status, fields.featured, fields.highlights, fields.includes, fields.excludes, fields.pickup_info,
        fields.faqs, fields.map_lat, fields.map_lng, fields.seo_title, fields.seo_description, fields.seo_keywords,
        now, now,
      );
    }

    // images
    run("DELETE FROM tour_images WHERE tour_id = ?", tourId);
    d.images.forEach((img, i) => {
      run(
        "INSERT INTO tour_images (id, tour_id, image_url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)",
        newId("img"), tourId, img.image_url, img.alt_text || d.title, i,
      );
    });

    // itinerary
    run("DELETE FROM tour_itinerary WHERE tour_id = ?", tourId);
    d.itinerary.forEach((item, i) => {
      run(
        "INSERT INTO tour_itinerary (id, tour_id, day, time, title, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        newId("itr"), tourId, item.day, item.time || null, item.title, item.description || null, i,
      );
    });

    // options
    run("DELETE FROM tour_options WHERE tour_id = ?", tourId);
    d.options.forEach((o, i) => {
      run(
        `INSERT INTO tour_options (id, tour_id, name, price, min_pax, max_pax, duration_text, inclusions, exclusions, is_available, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newId("opt"), tourId, o.name, o.price, o.min_pax, o.max_pax, o.duration_text || null,
        JSON.stringify(o.inclusions), JSON.stringify(o.exclusions), o.is_available ? 1 : 0, i,
      );
    });

    return { ok: true as const, id: tourId, slug };
  });
}

export type TourSaveInput = z.infer<typeof tourSchema>;

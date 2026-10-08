import { all, get } from "./db";
import type { BlogPost, Destination, Review, Tour, TourImage, TourOption } from "./types";

/** Shared read queries for public pages. All values come from the database. */

export type TourCardData = Tour & {
  destination_name: string | null;
  destination_slug: string | null;
  image_url: string | null;
  option_from: number | null;
};

const CARD_SELECT = `
  SELECT t.*, d.name AS destination_name, d.slug AS destination_slug,
         (SELECT image_url FROM tour_images i WHERE i.tour_id = t.id ORDER BY sort_order LIMIT 1) AS image_url,
         (SELECT MIN(price) FROM tour_options o WHERE o.tour_id = t.id AND o.is_available = 1) AS option_from
  FROM tours t
  LEFT JOIN destinations d ON d.id = t.destination_id
`;

export function featuredTours(limit = 8): TourCardData[] {
  return all<TourCardData>(
    `${CARD_SELECT} WHERE t.status = 'PUBLISHED' AND t.featured = 1 ORDER BY t.rating DESC LIMIT ?`, limit,
  );
}

export function latestTours(limit = 6): TourCardData[] {
  return all<TourCardData>(`${CARD_SELECT} WHERE t.status = 'PUBLISHED' ORDER BY t.rating DESC, t.review_count DESC LIMIT ?`, limit);
}

export function toursByDestination(destinationSlug: string, limit = 12, excludeTourId?: string): TourCardData[] {
  return all<TourCardData>(
    `${CARD_SELECT} WHERE t.status = 'PUBLISHED' AND d.slug = ? ${excludeTourId ? "AND t.id != ?" : ""} ORDER BY t.featured DESC, t.rating DESC LIMIT ?`,
    ...(excludeTourId ? [destinationSlug, excludeTourId, limit] : [destinationSlug, limit]),
  );
}

export function similarTours(tour: Tour, limit = 3): TourCardData[] {
  if (tour.destination_id) {
    const rows = all<TourCardData>(
      `${CARD_SELECT} WHERE t.status = 'PUBLISHED' AND t.destination_id = ? AND t.id != ? ORDER BY t.rating DESC LIMIT ?`,
      tour.destination_id, tour.id, limit,
    );
    if (rows.length) return rows;
  }
  return all<TourCardData>(
    `${CARD_SELECT} WHERE t.status = 'PUBLISHED' AND t.category = ? AND t.id != ? ORDER BY t.rating DESC LIMIT ?`,
    tour.category ?? "Culture", tour.id, limit,
  );
}

export function publishedDestinations(featuredOnly = false): Destination[] {
  return all<Destination>(
    `SELECT * FROM destinations ${featuredOnly ? "WHERE featured = 1" : ""} ORDER BY sort_order, name`,
  );
}

export function destinationBySlug(slug: string): Destination | undefined {
  return get<Destination>("SELECT * FROM destinations WHERE slug = ?", slug);
}

export function tourImages(tourId: string): TourImage[] {
  return all<TourImage>("SELECT * FROM tour_images WHERE tour_id = ? ORDER BY sort_order", tourId);
}

export function tourReviews(tourId: string, limit = 20): Review[] {
  return all<Review>("SELECT * FROM reviews WHERE tour_id = ? AND status = 'APPROVED' ORDER BY created_at DESC LIMIT ?", tourId, limit);
}

export function publishedPosts(limit = 10): BlogPost[] {
  return all<BlogPost>(
    "SELECT * FROM blog_posts WHERE status = 'PUBLISHED' ORDER BY published_at DESC LIMIT ?", limit,
  );
}

export function postBySlug(slug: string): BlogPost | undefined {
  return get<BlogPost>("SELECT * FROM blog_posts WHERE slug = ?", slug);
}

export function setting(key: string, fallback = ""): string {
  return get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key)?.value ?? fallback;
}

export function searchTours(opts: {
  q?: string; destination?: string; category?: string; region?: string;
  minDays?: number; maxDays?: number; minPrice?: number; maxPrice?: number;
  sort?: string; page?: number; limit?: number;
}): { items: TourCardData[]; total: number; page: number; totalPages: number } {
  const where: string[] = ["t.status = 'PUBLISHED'"];
  const params: (string | number)[] = [];
  if (opts.q) {
    where.push("(t.title LIKE ? OR t.short_description LIKE ? OR t.region LIKE ? OR d.name LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }
  if (opts.destination) { where.push("d.slug = ?"); params.push(opts.destination); }
  if (opts.category) { where.push("t.category = ?"); params.push(opts.category); }
  if (opts.region) { where.push("t.region LIKE ?"); params.push(`%${opts.region}%`); }
  if (opts.minDays) { where.push("t.duration_days >= ?"); params.push(opts.minDays); }
  if (opts.maxDays) { where.push("t.duration_days <= ?"); params.push(opts.maxDays); }
  if (opts.minPrice) { where.push("COALESCE(t.sale_price, t.base_price) >= ?"); params.push(opts.minPrice); }
  if (opts.maxPrice) { where.push("COALESCE(t.sale_price, t.base_price) <= ?"); params.push(opts.maxPrice); }

  const orderBy =
    opts.sort === "price_asc" ? "COALESCE(t.sale_price, t.base_price) ASC" :
    opts.sort === "price_desc" ? "COALESCE(t.sale_price, t.base_price) DESC" :
    opts.sort === "rating" ? "t.rating DESC, t.review_count DESC" :
    opts.sort === "duration" ? "t.duration_days ASC" :
    "t.featured DESC, t.rating DESC";

  const whereSql = where.join(" AND ");
  const limit = Math.min(60, Math.max(1, opts.limit ?? 12));
  const page = Math.max(1, opts.page ?? 1);
  const total = get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM tours t LEFT JOIN destinations d ON d.id = t.destination_id WHERE ${whereSql}`, ...params,
  )?.c ?? 0;
  const items = all<TourCardData>(
    `${CARD_SELECT} WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    ...params, limit, (page - 1) * limit,
  );
  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function tourCategories(): string[] {
  return all<{ category: string }>(
    "SELECT DISTINCT category FROM tours WHERE status = 'PUBLISHED' AND category IS NOT NULL ORDER BY category",
  ).map((r) => r.category);
}

export function tourOptionsWithBase(tourId: string): (TourOption & { is_default: number })[] {
  return all<TourOption & { is_default: number }>(
    `SELECT *, 0 AS is_default FROM tour_options WHERE tour_id = ? ORDER BY sort_order`, tourId,
  );
}

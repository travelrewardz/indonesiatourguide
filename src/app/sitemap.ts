import type { MetadataRoute } from "next";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "", "/tours", "/destinations", "/blog", "/about", "/contact", "/faq", "/agents", "/terms", "/privacy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/tours" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/tours" || path === "/destinations" ? 0.9 : 0.6,
  }));

  const tours = all<{ slug: string; updated_at: string; status: string }>(
    "SELECT slug, updated_at FROM tours WHERE status = 'PUBLISHED' ORDER BY updated_at DESC LIMIT 500",
  ).map((t) => ({
    url: `${BASE}/tours/${t.slug}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const destinations = all<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM destinations ORDER BY sort_order",
  ).map((d) => ({
    url: `${BASE}/destinations/${d.slug}`,
    lastModified: new Date(d.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const posts = all<{ slug: string; published_at: string | null }>(
    "SELECT slug, published_at FROM blog_posts WHERE status = 'PUBLISHED'",
  ).map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...destinations, ...tours, ...posts];
}

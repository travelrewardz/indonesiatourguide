/* Database smoke test: opens, migrates, seeds and prints row counts. */
import { getDb, all } from "../src/lib/db";

const db = getDb();
const tables = [
  "users", "suppliers", "agents", "destinations", "tours", "tour_images", "tour_itinerary",
  "tour_options", "availability", "bookings", "payments", "reviews", "enquiries", "quotes",
  "notifications", "blog_posts", "cms_pages", "settings", "fx_rates",
];
console.log("--- row counts ---");
for (const t of tables) {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number };
  console.log(`${t.padEnd(18)} ${row.c}`);
}
const published = all<{ c: number }>("SELECT COUNT(*) AS c FROM tours WHERE status = 'PUBLISHED'");
console.log("published tours:", published[0].c);
const sample = all<{ title: string; slug: string; base_price: number; rating: number }>(
  "SELECT title, slug, base_price, rating FROM tours ORDER BY featured DESC LIMIT 5",
);
console.log(sample);

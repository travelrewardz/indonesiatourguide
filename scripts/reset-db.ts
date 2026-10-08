/* Resets data/itg.sqlite to the pristine seeded demo state.
 *
 * Everything happens inside one BEGIN IMMEDIATE transaction on a single
 * connection, so a concurrently running `next start` either sees the old data
 * or the fully re-seeded data — never a half-wiped database. Foreign keys are
 * disabled only for this connection (the server keeps its own ON setting).
 *
 * Usage:  npx tsx scripts/reset-db.ts      (or: npm run db:reset)
 *         DATABASE_PATH=/other/path.sqlite npx tsx scripts/reset-db.ts
 */
import { getDb } from "../src/lib/db";
import { seedDatabase } from "../src/lib/seed";

const db = getDb(); // opens + migrates + seeds when the database doesn't exist yet

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all() as unknown as { name: string }[];

// PRAGMA foreign_keys is a no-op inside a transaction — set it before BEGIN.
db.exec("PRAGMA foreign_keys = OFF;");
db.exec("BEGIN IMMEDIATE");
try {
  for (const { name } of tables) db.exec(`DELETE FROM "${name}"`);
  seedDatabase(db);
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}
db.exec("PRAGMA foreign_keys = ON;");

const counts = ["users", "suppliers", "tours", "bookings", "payments", "availability", "settings"]
  .map((t) => {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number };
    return `${t}=${row.c}`;
  })
  .join("  ");
console.log(`reset complete — ${counts}`);

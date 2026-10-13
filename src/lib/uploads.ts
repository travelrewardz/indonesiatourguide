import path from "node:path";

/**
 * Directory holding runtime uploads.
 *
 * Sits next to the SQLite database, so on hosts that mount a single
 * persistent disk (DATABASE_PATH points into it) both the DB and the images
 * survive redeploys instead of living on an ephemeral container layer.
 */
export function uploadsDir(): string {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "itg.sqlite");
  return path.join(path.dirname(dbPath), "uploads");
}

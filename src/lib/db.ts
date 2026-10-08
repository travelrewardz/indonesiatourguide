import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS } from "./migrations";
import { seedDatabase } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
export const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, "itg.sqlite");

type DbHandle = DatabaseSync;
type Param = string | number | boolean | bigint | null | undefined | Uint8Array;

type DbGlobals = { __itgDb?: DbHandle; __itgSeeding?: boolean };

function open(): DbHandle {
  if (DB_PATH !== ":memory:") {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  migrate(db);
  return db;
}

function migrate(db: DbHandle): void {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const next = MIGRATIONS[version];
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(next);
      version += 1;
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec("COMMIT");
    } catch (err) {
      try {
        db.exec("ROLLBACK");
      } catch {
        /* ignore */
      }
      throw err;
    }
  }
}

/** Returns the process-wide database handle, running migrations + first-run seed once. */
export function getDb(): DbHandle {
  const g = globalThis as DbGlobals;
  if (g.__itgDb) return g.__itgDb;
  const db = open();
  g.__itgDb = db;
  if (!g.__itgSeeding) {
    const marker = db.prepare("SELECT value FROM settings WHERE key = 'seeded'").get();
    if (!marker) {
      g.__itgSeeding = true;
      try {
        seedDatabase(db);
      } finally {
        g.__itgSeeding = false;
      }
    }
  }
  return db;
}

function normalize(p: Param): string | number | bigint | null | Uint8Array {
  if (p === undefined || p === null) return null;
  if (typeof p === "boolean") return p ? 1 : 0;
  return p;
}

export function all<T = Record<string, unknown>>(sql: string, ...params: Param[]): T[] {
  const rows = getDb()
    .prepare(sql)
    .all(...params.map(normalize)) as unknown as Record<string, unknown>[];
  // node:sqlite returns null-prototype objects — spread into plain objects so
  // they can be safely passed to Client Components (RSC serialization).
  return rows.map((row) => ({ ...row })) as T[];
}

export function get<T = Record<string, unknown>>(sql: string, ...params: Param[]): T | undefined {
  const row = getDb()
    .prepare(sql)
    .get(...params.map(normalize)) as Record<string, unknown> | undefined;
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: Param[]): { changes: number; lastInsertRowid: number } {
  const res = getDb()
    .prepare(sql)
    .run(...params.map(normalize));
  return { changes: Number(res.changes), lastInsertRowid: Number(res.lastInsertRowid) };
}

export function exec(sql: string): void {
  getDb().exec(sql);
}

/**
 * Runs `fn` inside a write transaction (BEGIN IMMEDIATE).
 * SQLite serializes writers, so concurrent booking attempts are applied one at a time —
 * this is what prevents overbooking.
 */
export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

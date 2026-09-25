import fs from "fs";
import path from "path";
import type { Db } from "./types";
import { RATE_TIERS } from "@/data/catalog";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function seedDb(): Db {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  return {
    partners: [
      {
        id: "p-demo-gold",
        companyName: "Wisata Global Agencies",
        contactName: "Demo Partner",
        email: "demo@wisataagencies.com",
        passwordHash: "$2b$10$QhhxSxM8Hhn7N.9WQPx9KOUvHhHzHn/cwXIJylckiqLPsF41GxCKC", // "demo1234"
        country: "Singapore",
        phone: "+65 6222 8899",
        website: "https://wisataagencies.com",
        tier: "gold",
        approved: true,
        createdAt: iso(new Date(now.getFullYear(), 0, 15)),
      },
      {
        id: "p-demo-silver",
        companyName: "Viajes Atlas",
        contactName: "Maria Lopez",
        email: "maria@atlastours.es",
        passwordHash: "$2b$10$QhhxSxM8Hhn7N.9WQPx9KOUvHhHzHn/cwXIJylckiqLPsF41GxCKC", // "demo1234"
        country: "Spain",
        phone: "+34 91 555 0132",
        website: "https://atlastours.es",
        tier: "silver",
        approved: true,
        createdAt: iso(new Date(now.getFullYear(), 2, 2)),
      },
    ],
    quotes: [
      {
        id: "q-1001",
        partnerId: "p-demo-gold",
        tourSlug: "komodo-phinisi-sailing-4-days",
        travelDate: iso(new Date(now.getFullYear(), 8, 12)),
        pax: 8,
        language: "es",
        notes: "Family group, two children aged 9 and 12.",
        netPerPerson: 920,
        netTotal: 7360,
        status: "sent",
        createdAt: iso(new Date(now.getTime() - 12 * 86400000)),
        updatedAt: iso(new Date(now.getTime() - 5 * 86400000)),
      },
      {
        id: "q-1002",
        partnerId: "p-demo-gold",
        tourSlug: "java-borobudur-bromo-6-days",
        travelDate: iso(new Date(now.getFullYear(), 10, 3)),
        pax: 14,
        language: "en",
        notes: "Corporate incentive, needs boardroom dinner night 3.",
        netPerPerson: 792,
        netTotal: 11088,
        status: "negotiating",
        createdAt: iso(new Date(now.getTime() - 8 * 86400000)),
        updatedAt: iso(new Date(now.getTime() - 2 * 86400000)),
      },
      {
        id: "q-1003",
        partnerId: "p-demo-silver",
        tourSlug: "bali-essentials-5-days",
        travelDate: iso(new Date(now.getFullYear(), 7, 20)),
        pax: 6,
        language: "es",
        notes: "",
        netPerPerson: 663,
        netTotal: 3978,
        status: "accepted",
        createdAt: iso(new Date(now.getTime() - 20 * 86400000)),
        updatedAt: iso(new Date(now.getTime() - 15 * 86400000)),
      },
    ],
    bookings: [
      {
        id: "b-5001",
        partnerId: "p-demo-gold",
        quoteId: "q-1003",
        tourSlug: "bali-essentials-5-days",
        confirmationCode: "ITG-58214",
        travelDate: iso(new Date(now.getFullYear(), 7, 20)),
        pax: 6,
        language: "es",
        grossTotal: 4680,
        netTotal: 3978,
        status: "confirmed",
        createdAt: iso(new Date(now.getTime() - 14 * 86400000)),
      },
      {
        id: "b-5002",
        partnerId: "p-demo-gold",
        tourSlug: "bali-nusa-penida-honeymoon-6-days",
        confirmationCode: "ITG-58377",
        travelDate: iso(new Date(now.getFullYear(), 6, 8)),
        pax: 2,
        language: "de",
        grossTotal: 3300,
        netTotal: 2640,
        status: "confirmed",
        createdAt: iso(new Date(now.getTime() - 60 * 86400000)),
      },
      {
        id: "b-5003",
        partnerId: "p-demo-gold",
        tourSlug: "komodo-phinisi-sailing-4-days",
        confirmationCode: "ITG-57990",
        travelDate: iso(new Date(now.getFullYear(), 4, 30)),
        pax: 10,
        language: "en",
        grossTotal: 11500,
        netTotal: 9200,
        status: "confirmed",
        createdAt: iso(new Date(now.getTime() - 110 * 86400000)),
      },
      {
        id: "b-5004",
        partnerId: "p-demo-gold",
        tourSlug: "sumatra-orangutan-lake-toba-7-days",
        confirmationCode: "ITG-57845",
        travelDate: iso(new Date(now.getFullYear(), 1, 18)),
        pax: 4,
        language: "en",
        grossTotal: 4200,
        netTotal: 3360,
        status: "cancelled",
        createdAt: iso(new Date(now.getTime() - 180 * 86400000)),
      },
      {
        id: "b-5005",
        partnerId: "p-demo-silver",
        tourSlug: "raja-ampat-island-hopping-8-days",
        confirmationCode: "ITG-58102",
        travelDate: iso(new Date(now.getFullYear(), 9, 14)),
        pax: 8,
        language: "es",
        grossTotal: 18800,
        netTotal: 15980,
        status: "options",
        createdAt: iso(new Date(now.getTime() - 30 * 86400000)),
      },
    ],
    enquiries: [],
  };
}

let dbCache: Db | null = null;

export function readDb(): Db {
  if (dbCache) return dbCache;
  if (!fs.existsSync(DB_PATH)) {
    const seeded = seedDb();
    writeDb(seeded);
    dbCache = seeded;
    return seeded;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  dbCache = JSON.parse(raw) as Db;
  return dbCache;
}

export function writeDb(db: Db): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  dbCache = db;
}

export function netRateFor(tier: string): number {
  const t = RATE_TIERS.find((r) => r.id === tier);
  return t ? t.discountPct : 10;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

import crypto from "crypto";
import { cookies } from "next/headers";
import { readDb } from "./db";
import type { Partner } from "./types";

const COOKIE = "itg_session";

function sign(value: string): string {
  // HMAC signature with a local secret. Good enough for demo;
  // use a proper secret manager in production.
  const secret = process.env.SESSION_SECRET || "itg-dev-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);
}

export async function createSession(partnerId: string): Promise<void> {
  const store = await cookies();
  const payload = `${partnerId}.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSessionPartner(): Promise<Partner | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [partnerId, ts, sig] = parts;
  if (sign(`${partnerId}.${ts}`) !== sig) return null;
  const db = readDb();
  return db.partners.find((p) => p.id === partnerId) ?? null;
}

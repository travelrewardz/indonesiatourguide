import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { get, run, nowIso } from "./db";
import type { SessionUser, User, UserRole } from "./types";

const COOKIE = "itg_session";
const SESSION_DAYS = 14;
export const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// ---------------------------------------------------------------- passwords
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ secrets
function sessionSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const existing = get<{ value: string }>("SELECT value FROM settings WHERE key = 'session_secret'");
  if (existing) return existing.value;
  const generated = crypto.randomBytes(48).toString("hex");
  run("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", "session_secret", generated, nowIso());
  return generated;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

// ----------------------------------------------------------------- sessions
export async function createSession(userId: string): Promise<void> {
  const store = await cookies();
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let parsed: { uid: string; exp: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
  if (!parsed.uid || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
  const user = get<Pick<User, "id" | "name" | "email" | "role" | "status">>(
    "SELECT id, name, email, role, status FROM users WHERE id = ?", parsed.uid,
  );
  if (!user || user.status !== "ACTIVE") return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
}

/** Server-component guard: redirects to login when not authenticated. */
export async function requireUser(roles?: UserRole[], next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  if (roles && !roles.includes(user.role)) redirect("/403");
  return user;
}

/** Route-handler guard: returns a 401/403 Response or the user. */
export async function requireApi(roles?: UserRole[]): Promise<SessionUser | Response> {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (roles && !roles.includes(user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

export function homeFor(role: UserRole): string {
  switch (role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    case "SUPPLIER":
      return "/supplier";
    case "TRAVEL_AGENT":
      return "/agents";
    default:
      return "/account";
  }
}

// -------------------------------------------------------------- csrf / origin
/**
 * Cookie-authenticated state-changing requests must come from our own origin
 * (SameSite=Lax already blocks most cross-site writes; this closes the rest).
 */
export async function isSameOriginRequest(req: Request): Promise<boolean> {
  const origin = req.headers.get("origin");
  if (!origin) {
    const fetchSite = req.headers.get("sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;
    return true;
  }
  try {
    const host = (await headers()).get("host");
    return origin === PUBLIC_APP_URL || origin === `http://${host}` || origin === `https://${host}`;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------- rate limit
const buckets = new Map<string, { count: number; reset: number }>();

/** Fixed-window in-memory rate limiter. Single-instance; swap for Redis/KV when scaling out. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

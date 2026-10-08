import { NextRequest } from "next/server";
import { get } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { clientIp, createSession, homeFor, isSameOriginRequest, rateLimit, verifyPassword } from "@/lib/auth";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isSameOriginRequest(req))) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const ip = await clientIp();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email and password" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  if (!rateLimit(`login:${ip}:${email}`, 8, 5 * 60 * 1000)) {
    return Response.json({ error: "Too many login attempts. Please wait a few minutes." }, { status: 429 });
  }

  const user = get<User>("SELECT * FROM users WHERE email = ?", email);
  // Constant-ish behaviour: always run a compare to avoid user enumeration timing.
  const ok = user ? verifyPassword(password, user.password_hash) : verifyPassword(password, "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
  if (!user || !ok) {
    return Response.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  if (user.status === "SUSPENDED") {
    return Response.json({ error: "This account has been suspended. Contact support." }, { status: 403 });
  }
  if (user.role !== "CUSTOMER" && user.status === "PENDING") {
    return Response.json({ error: "Your account is awaiting approval. We'll email you once it's reviewed." }, { status: 403 });
  }

  await createSession(user.id);
  return Response.json({ ok: true, role: user.role, redirect: homeFor(user.role) });
}

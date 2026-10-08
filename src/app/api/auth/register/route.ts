import { NextRequest } from "next/server";
import { get, run, newId, nowIso, tx } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { createSession, hashPassword, isSameOriginRequest, rateLimit, clientIp } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notify";
import { emails, queueEmail } from "@/lib/email";
import { deliverEmails } from "@/lib/notify";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isSameOriginRequest(req))) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 10, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const input = parsed.data;

  const existing = get<User>("SELECT id FROM users WHERE email = ?", input.email);
  if (existing) {
    return Response.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  try {
    const ids = tx(() => {
      const userId = newId("usr");
      run(
        `INSERT INTO users (id, name, email, phone, country, password_hash, auth_provider, provider_id, role, status, preferred_language, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'credentials', NULL, ?, ?, 'en', ?, ?)`,
        userId, input.name, input.email, input.phone || null, input.country || null,
        hashPassword(input.password), input.role,
        input.role === "CUSTOMER" ? "ACTIVE" : "PENDING",
        nowIso(), nowIso(),
      );

      if (input.role === "TRAVEL_AGENT") {
        run(
          `INSERT INTO agents (id, user_id, company, contact_person, email, phone, country, website, status, commission_pct, net_rate_access, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'PENDING', 15, 1, ?, ?)`,
          newId("agt"), userId, input.company || `${input.name} Travel`, input.name, input.email,
          input.phone || null, input.country || null, nowIso(), nowIso(),
        );
        notifyAdmins("agent", "New travel agent registration", `${input.name} (${input.company || "agency"}) applied for a B2B account.`, "/admin/agents");
      } else if (input.role === "SUPPLIER") {
        run(
          `INSERT INTO suppliers (id, user_id, company_name, contact_person, email, phone, address, destinations, license_number, verification_status, bank_info, commission_pct, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL, '[]', NULL, 'PENDING', NULL, 15, ?, ?)`,
          newId("sup"), userId, input.company || `${input.name} Tours`, input.name, input.email,
          input.phone || null, nowIso(), nowIso(),
        );
        notifyAdmins("supplier", "New supplier application", `${input.company || input.name} applied as a tour operator.`, "/admin/suppliers");
      } else {
        notifyAdmins("account", "New customer registration", `${input.name} (${input.email}) created an account.`, "/admin/customers");
      }
      return userId;
    });

    await createSession(ids);
    queueEmail(input.email, input.name, "Welcome to Indonesia Tour Guide",
      emails.welcome({ name: input.name.split(" ")[0], href: "/account" }));
    void deliverEmails();
    return Response.json({ ok: true, role: input.role });
  } catch (err) {
    return Response.json({ error: "Registration failed. Please try again." + (process.env.NODE_ENV !== "production" ? ` ${String(err)}` : "") }, { status: 500 });
  }
}

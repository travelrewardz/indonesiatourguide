import { NextRequest } from "next/server";
import { run, newId, nowIso } from "@/lib/db";
import { enquirySchema } from "@/lib/validation";
import { isSameOriginRequest, rateLimit, clientIp } from "@/lib/auth";
import { notifyAdmins, deliverEmails } from "@/lib/notify";
import { emails, queueEmail } from "@/lib/email";

export const runtime = "nodejs";

/** POST /api/enquiries — contact form, tailor-made request, quote request. */
export async function POST(req: NextRequest) {
  if (!(await isSameOriginRequest(req))) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const ip = await clientIp();
  if (!rateLimit(`enquiry:${ip}`, 12, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const i = parsed.data;

  run(
    `INSERT INTO enquiries (id, type, name, email, phone, country, tour_slug, destination, travel_date, pax, budget, interests, accommodation, message, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?)`,
    newId("enq"), i.type, i.name, i.email, i.phone || null, i.country || null,
    i.tour_slug || null, i.destination || null, i.travel_date || null, i.pax ?? null,
    i.budget || null, i.interests || null, i.accommodation || null, i.message, nowIso(), nowIso(),
  );

  const label =
    i.type === "tailor_made" ? "New tailor-made itinerary request" :
    i.type === "quote" ? "New quote request" : "New contact message";
  notifyAdmins("enquiry", label, `${i.name} (${i.email}) — ${i.message.slice(0, 120)}`, "/admin/enquiries");

  queueEmail(i.email, i.name, "We've received your request — Indonesia Tour Guide",
    emails.enquiryReceived({ name: i.name.split(" ")[0], subject: i.destination || i.tour_slug || "your trip plans" }));
  void deliverEmails();

  return Response.json({ ok: true });
}

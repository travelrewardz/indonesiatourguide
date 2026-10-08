import { NextRequest } from "next/server";
import { all, get } from "@/lib/db";
import { bookingSchema } from "@/lib/validation";
import { createBooking, BookingError } from "@/lib/booking";
import { getProvider } from "@/lib/payments";
import { requireApi, isSameOriginRequest, rateLimit, clientIp } from "@/lib/auth";
import { fmtDate, money } from "@/lib/format";
import type { Booking, Tour } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/bookings — create a booking (guest or authenticated).
 * The total is computed server-side; client-supplied prices are ignored.
 */
export async function POST(req: NextRequest) {
  if (!(await isSameOriginRequest(req))) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const ip = await clientIp();
  if (!rateLimit(`booking:${ip}`, 20, 60 * 60 * 1000)) {
    return Response.json({ error: "Too many booking attempts. Please wait." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid booking data" }, { status: 400 });
  }
  const input = parsed.data;
  if (!input.agree) {
    return Response.json({ error: "Please accept the booking terms to continue" }, { status: 400 });
  }

  // Attach session (guest bookings allowed → user may be null)
  let user: { id: string; role: string } | null = null;
  const auth = await requireApi();
  if (!(auth instanceof Response)) user = { id: auth.id, role: auth.role };

  try {
    const { booking, pricing, provider } = createBooking({
      tourSlug: input.tourSlug,
      optionId: input.optionId || null,
      travelDate: input.travelDate,
      adults: input.adults,
      children: input.children,
      pickupLocation: input.pickupLocation,
      hotel: input.hotel,
      specialRequest: input.specialRequest,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      paymentProvider: input.paymentProvider,
      user,
    });

    const payment = get<{ id: string }>("SELECT id FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1", booking.id);
    const payProvider = getProvider(input.paymentProvider);
    const intent = payment ? await payProvider.createIntent(payment as never, booking, "") : null;

    return Response.json({
      ok: true,
      bookingNumber: booking.booking_number,
      total: pricing.total,
      currency: "USD",
      paymentUrl: intent?.redirectUrl ?? `/account/bookings/${booking.booking_number}`,
    });
  } catch (err) {
    if (err instanceof BookingError) {
      const code = err.code === "SOLD_OUT" ? 409 : err.code === "NOT_FOUND" ? 404 : 400;
      return Response.json({ error: err.message, code: err.code }, { status: code });
    }
    return Response.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}

/**
 * GET /api/bookings — role-scoped listing (customer sees own, agent sees own,
 * supplier sees own tours, admin sees all). `?format=csv` exports.
 */
export async function GET(req: NextRequest) {
  const auth = await requireApi();
  if (auth instanceof Response) return auth;

  const params = req.nextUrl.searchParams;
  const where: string[] = [];
  const args: string[] = [];

  if (auth.role === "CUSTOMER") {
    where.push("b.customer_id = ?");
    args.push(auth.id);
  } else if (auth.role === "TRAVEL_AGENT") {
    where.push("b.agent_id IN (SELECT id FROM agents WHERE user_id = ?)");
    args.push(auth.id);
  } else if (auth.role === "SUPPLIER") {
    where.push("t.supplier_id IN (SELECT id FROM suppliers WHERE user_id = ?)");
    args.push(auth.id);
  } else if (params.get("status")) {
    where.push("b.booking_status = ?");
    args.push(params.get("status") as string);
  }

  const limit = Math.min(200, Number(params.get("limit") || 50));
  const rows = all<Booking & { tour_title: string; tour_slug: string }>(
    `SELECT b.*, t.title AS tour_title, t.slug AS tour_slug
     FROM bookings b JOIN tours t ON t.id = b.tour_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY b.created_at DESC LIMIT ${limit}`,
    ...args,
  );

  if (params.get("format") === "csv") {
    const header = "booking_number,tour,travel_date,pax,total,currency,payment_status,booking_status,customer,email,created_at";
    const lines = rows.map((r) =>
      [r.booking_number, `"${r.tour_title}"`, r.travel_date, r.pax, r.total_price, r.currency, r.payment_status, r.booking_status, `"${r.customer_name}"`, r.customer_email, r.created_at].join(","),
    );
    return new Response([header, ...lines].join("\n"), {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"` },
    });
  }
  return Response.json({ items: rows });
}

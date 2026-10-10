import { NextRequest } from "next/server";
import { get } from "@/lib/db";
import { requireApi } from "@/lib/auth";
import type { Booking, Payment, Tour } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mirrors ownsBooking in src/lib/actions.ts — owner, or admin, or the supplier running the tour. */
function canView(role: string, userId: string, booking: Booking): boolean {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
  if (booking.customer_id === userId) return true;
  if (role === "TRAVEL_AGENT") {
    const agent = get<{ id: string }>("SELECT id FROM agents WHERE user_id = ?", userId);
    return !!agent && booking.agent_id === agent.id;
  }
  if (role === "SUPPLIER") {
    const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", userId);
    if (!supplier) return false;
    const tour = get<{ supplier_id: string | null }>("SELECT supplier_id FROM tours WHERE id = ?", booking.tour_id);
    return tour?.supplier_id === supplier.id;
  }
  return false;
}

/**
 * GET /api/bookings/{number} — single booking for the authenticated owner
 * (customer, agent, supplier of the tour) or admin. Returns 404 for unknown
 * *and* unauthorized numbers so booking numbers cannot be enumerated.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ number: string }> }) {
  const auth = await requireApi();
  if (auth instanceof Response) return auth;

  const { number } = await ctx.params;
  const booking = get<Booking>("SELECT * FROM bookings WHERE booking_number = ?", number);
  if (!booking || !canView(auth.role, auth.id, booking)) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  const tour = get<Pick<Tour, "id" | "title" | "slug">>(
    "SELECT id, title, slug FROM tours WHERE id = ?", booking.tour_id,
  );
  const payment = get<Payment>(
    "SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1", booking.id,
  );

  return Response.json({
    booking,
    tour: tour ?? null,
    payment: payment
      ? { id: payment.id, provider: payment.provider, status: payment.status, transaction_id: payment.transaction_id }
      : null,
  });
}

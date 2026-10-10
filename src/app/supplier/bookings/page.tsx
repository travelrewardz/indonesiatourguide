import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { confirmBookingFormAction, completeBookingFormAction, cancelBookingFormAction } from "@/lib/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { fmtDate } from "@/lib/format";
import { displayMoney } from "@/lib/currency";
import { getDisplayCurrency } from "@/lib/prefs";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SupplierBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = (await getSessionUser())!;
  const currency = await getDisplayCurrency();
  const { status } = await searchParams;
  const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", user.id);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (!supplier && !isAdmin) return <div className="card p-8">No supplier profile.</div>;

  const where: string[] = [];
  const args: (string | null)[] = [];
  if (supplier) {
    where.push("t.supplier_id = ?");
    args.push(supplier.id);
  }
  if (status) {
    where.push("b.booking_status = ?");
    args.push(status);
  }

  const bookings = all<Booking & { tour_title: string; tour_slug: string }>(
    `SELECT b.*, t.title AS tour_title, t.slug AS tour_slug FROM bookings b JOIN tours t ON t.id = b.tour_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY b.travel_date DESC LIMIT 200`,
    ...(args as string[]),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-medium">Bookings ({bookings.length})</h2>
        <div className="flex gap-2">
          {["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
            <Link key={s || "all"} href={s ? `/supplier/bookings?status=${s}` : "/supplier/bookings"}
              className={`btn-sm rounded-full ${(!status && !s) || status === s ? "btn-primary" : "btn-outline"}`}>
              {s || "All"}
            </Link>
          ))}
          <a href="/api/bookings?format=csv" className="btn-outline btn-sm">⬇ CSV</a>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-sm text-gray-600">No bookings match this filter.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-gray-400">{b.booking_number}</div>
                  <div className="font-semibold">{b.tour_title}</div>
                  <div className="text-sm text-gray-500">
                    {fmtDate(b.travel_date)} · {b.pax} pax · {b.customer_name} ({b.customer_email})
                  </div>
                  {b.pickup_location && <div className="text-xs text-gray-400">Pickup: {b.pickup_location}{b.hotel ? ` · ${b.hotel}` : ""}</div>}
                  {b.special_request && <div className="mt-1 rounded bg-sand-50 px-2 py-1 text-xs text-gray-600">REQ: {b.special_request}</div>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-brand-700">{displayMoney(b.total_price, currency)}</div>
                  <div className="text-xs text-gray-400">your share {displayMoney(b.supplier_amount, currency)}</div>
                  <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                    <span className={`badge ${b.booking_status === "CONFIRMED" ? "bg-brand-100 text-brand-700" : b.booking_status === "CANCELLED" ? "bg-red-100 text-red-700" : b.booking_status === "COMPLETED" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-800"}`}>
                      {b.booking_status}
                    </span>
                    <span className={`badge ${b.payment_status === "PAID" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>
                      {b.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                {b.confirmation_status === "UNCONFIRMED" && b.booking_status === "PENDING" && (
                  <form action={confirmBookingFormAction}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button type="submit" className="btn-primary btn-sm">✓ Confirm booking</button>
                  </form>
                )}
                {b.booking_status === "CONFIRMED" && (
                  <form action={completeBookingFormAction}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button type="submit" className="btn-outline btn-sm">Mark completed</button>
                  </form>
                )}
                {(b.booking_status === "PENDING" || b.booking_status === "CONFIRMED") && (
                  <form action={cancelBookingFormAction}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <ConfirmSubmit confirmText="Cancel this booking? Slots will be released and the customer notified.">
                      Cancel
                    </ConfirmSubmit>
                  </form>
                )}
                <Link href={`/tours/${b.tour_slug}`} className="btn-ghost btn-sm">Tour page ↗</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

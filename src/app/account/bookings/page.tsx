import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { displayMoney } from "@/lib/currency";
import { getDisplayCurrency } from "@/lib/prefs";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-brand-100 text-brand-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
};

export default async function AccountBookingsPage() {
  const user = (await getSessionUser())!;
  const currency = await getDisplayCurrency();
  const bookings = all<Booking & { tour_title: string; tour_slug: string; image_url: string | null }>(
    `SELECT b.*, t.title AS tour_title, t.slug AS tour_slug,
            (SELECT image_url FROM tour_images i WHERE i.tour_id = t.id ORDER BY sort_order LIMIT 1) AS image_url
     FROM bookings b JOIN tours t ON t.id = b.tour_id
     WHERE b.customer_id = ? ORDER BY b.created_at DESC`, user.id,
  );

  return (
    <div>
      <h2 className="font-display mb-4 text-xl font-medium">My bookings ({bookings.length})</h2>
      {bookings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-600">Nothing here yet — your bookings will appear after checkout.</p>
          <Link href="/tours" className="btn-primary mt-4">Find a tour</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-gray-400">{b.booking_number}</div>
                  <Link href={`/tours/${b.tour_slug}`} className="text-lg font-bold hover:text-brand-600">{b.tour_title}</Link>
                  <div className="mt-1 text-sm text-gray-500">
                    {fmtDate(b.travel_date)} · {b.pax} travellers · {b.pickup_location}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <span className={`badge ${STATUS_STYLE[b.booking_status] ?? ""}`}>{b.booking_status}</span>
                    <span className={`badge ${b.payment_status === "PAID" ? "bg-brand-100 text-brand-700" : b.payment_status === "REFUNDED" ? "bg-blue-100 text-blue-700" : b.payment_status === "FAILED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                      {b.payment_status}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-brand-700">{displayMoney(b.total_price, currency)}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <Link href={`/account/bookings/${b.booking_number}`} className="btn-primary btn-sm">View booking</Link>
                <Link href={`/account/bookings/${b.booking_number}/voucher`} className="btn-outline btn-sm">Voucher</Link>
                {b.payment_status === "PENDING" && b.booking_status === "PENDING" && (
                  <Link href={`/account/bookings/${b.booking_number}?pay=1`} className="btn-accent btn-sm">Complete payment</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

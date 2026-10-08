import Link from "next/link";
import { all } from "@/lib/db";
import {
  markPaidFormAction, confirmBookingFormAction, completeBookingFormAction, cancelBookingFormAction,
} from "@/lib/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { fmtDate, fmtDateTime } from "@/lib/format";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const where: string[] = [];
  const args: string[] = [];
  if (sp.status) {
    where.push("b.booking_status = ?");
    args.push(sp.status);
  }
  if (sp.q) {
    where.push("(b.booking_number LIKE ? OR b.customer_name LIKE ? OR b.customer_email LIKE ? OR t.title LIKE ?)");
    const like = `%${sp.q}%`;
    args.push(like, like, like, like);
  }

  const bookings = all<Booking & { tour_title: string }>(
    `SELECT b.*, t.title AS tour_title FROM bookings b JOIN tours t ON t.id = b.tour_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY b.created_at DESC LIMIT 200`,
    ...args,
  );

  const filters = ["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REFUNDED"];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Bookings ({bookings.length})</h1>
        <div className="flex gap-2">
          <a href="/api/bookings?format=csv" className="btn-outline btn-sm">⬇ Export CSV</a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {filters.map((s) => (
          <Link key={s || "all"} href={s ? `/admin/bookings?status=${s}` : "/admin/bookings"}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${(!sp.status && !s) || sp.status === s ? "bg-ink text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
            {s || "All"}
          </Link>
        ))}
        <form method="get" className="ml-auto flex gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search booking / customer…" className="input w-56 py-1.5 text-sm" />
          <button type="submit" className="btn-outline btn-sm">Search</button>
        </form>
      </div>

      {bookings.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-sm text-gray-600">No bookings found.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-gray-400">{b.booking_number} · {fmtDateTime(b.created_at)}</div>
                  <div className="font-semibold">{b.tour_title}</div>
                  <div className="text-sm text-gray-500">
                    {b.customer_name} · {b.customer_email}{b.customer_phone ? ` · ${b.customer_phone}` : ""}
                  </div>
                  <div className="text-sm text-gray-500">
                    Travel {fmtDate(b.travel_date)} · {b.pax} pax · pickup: {b.pickup_location}
                    {b.agent_id ? " · via agent" : b.source === "website" ? "" : ` · ${b.source}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-brand-700">${b.total_price.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">supplier ${b.supplier_amount.toFixed(2)} · comm ${b.commission.toFixed(2)}</div>
                  <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
                    <span className={`badge ${b.booking_status === "CONFIRMED" ? "bg-brand-100 text-brand-700" : b.booking_status === "CANCELLED" ? "bg-red-100 text-red-700" : b.booking_status === "COMPLETED" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-800"}`}>{b.booking_status}</span>
                    <span className={`badge ${b.payment_status === "PAID" ? "bg-brand-100 text-brand-700" : b.payment_status === "REFUNDED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{b.payment_status}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                {b.payment_status === "PENDING" && (
                  <form action={markPaidFormAction}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button type="submit" className="btn-accent btn-sm">Mark as paid</button>
                  </form>
                )}
                {b.confirmation_status === "UNCONFIRMED" && b.booking_status !== "CANCELLED" && (
                  <form action={confirmBookingFormAction}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button type="submit" className="btn-primary btn-sm">Confirm</button>
                  </form>
                )}
                {b.booking_status === "CONFIRMED" && (
                  <form action={completeBookingFormAction}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button type="submit" className="btn-outline btn-sm">Complete</button>
                  </form>
                )}
                {b.booking_status !== "CANCELLED" && b.booking_status !== "COMPLETED" && (
                  <form action={cancelBookingFormAction}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <ConfirmSubmit confirmText="Cancel and release inventory? Refund if paid.">Cancel</ConfirmSubmit>
                  </form>
                )}
                <Link href={`/account/bookings/${b.booking_number}`} className="btn-ghost btn-sm">View voucher ↗</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

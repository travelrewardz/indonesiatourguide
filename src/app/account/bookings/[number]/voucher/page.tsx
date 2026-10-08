import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { getVoucher } from "@/lib/voucher";
import { fmtDate, fmtDateTime } from "@/lib/format";
import PrintButton from "@/components/PrintButton";
import type { Booking, User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VoucherPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const session = (await getSessionUser())!;
  const booking = get<Booking>("SELECT * FROM bookings WHERE booking_number = ?", number);
  if (!booking) notFound();
  const user = get<User>("SELECT * FROM users WHERE id = ?", session.id);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  if (booking.customer_id !== session.id && !isAdmin) notFound();

  const v = await getVoucher(number);
  if (!v) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between no-print">
        <Link href={`/account/bookings/${number}`} className="text-sm font-medium text-brand-600 hover:underline">← Back to booking</Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10" style={{ printColorAdjust: "exact" }}>
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-5">
          <div>
            <div className="text-2xl font-bold tracking-tight">
              Indonesia <span className="text-brand-600">Tour Guide</span>
            </div>
            <div className="mt-0.5 text-xs uppercase tracking-[0.2em] text-gray-500">Booking voucher</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-bold">{v.booking.booking_number}</div>
            <div className="text-xs text-gray-500">Issued {fmtDateTime(v.booking.created_at)}</div>
          </div>
        </div>

        {/* main grid */}
        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_180px]">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Tour</div>
            <h1 className="text-2xl font-bold leading-tight">{v.tour.title}</h1>
            <div className="mt-1 text-sm text-gray-600">
              {v.tour.duration_text} · {v.tour.region} {v.option ? `· ${v.option.name}` : ""}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-gray-400">Customer</dt>
                <dd className="font-semibold">{v.booking.customer_name}</dd>
                <dd className="text-gray-600">{v.booking.customer_email}</dd>
                {v.booking.customer_phone && <dd className="text-gray-600">{v.booking.customer_phone}</dd>}
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-400">Travel date</dt>
                <dd className="font-semibold">{fmtDate(v.booking.travel_date)}</dd>
                <dd className="text-gray-600">{v.booking.pax} travellers ({v.booking.adults} adults{v.booking.children ? `, ${v.booking.children} children` : ""})</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-400">Pickup</dt>
                <dd className="font-semibold">{v.booking.pickup_location}</dd>
                {v.booking.hotel && <dd className="text-gray-600">{v.booking.hotel}</dd>}
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-400">Status</dt>
                <dd className="font-semibold">{v.booking.booking_status} · {v.booking.payment_status}</dd>
                <dd className="text-gray-600">Total {v.booking.currency} {v.booking.total_price.toFixed(2)}</dd>
              </div>
              {v.supplier && (
                <div className="col-span-2">
                  <dt className="text-xs uppercase text-gray-400">Operated by</dt>
                  <dd className="font-semibold">{v.supplier.company_name}</dd>
                  <dd className="text-gray-600">{v.supplier.phone} · {v.supplier.email}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex flex-col items-center justify-start rounded-xl border border-gray-200 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.qrDataUrl} alt={`QR code for booking ${v.booking.booking_number}`} width={150} height={150} />
            <div className="mt-2 text-center text-[11px] leading-4 text-gray-500">
              Scan to verify<br />{v.booking.booking_number}
            </div>
          </div>
        </div>

        {/* itinerary */}
        {v.itinerary.length > 0 && (
          <div className="mt-7 border-t border-gray-200 pt-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Tour plan</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {v.itinerary.slice(0, 8).map((item) => (
                <li key={`${item.day}-${item.title}`} className="flex gap-3">
                  <span className="w-14 shrink-0 font-semibold text-brand-700">Day {item.day}</span>
                  <span>{item.title}{item.time ? ` (${item.time})` : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* includes */}
        {v.includes.length > 0 && (
          <div className="mt-5 border-t border-gray-200 pt-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">What&apos;s included</div>
            <ul className="mt-2 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
              {v.includes.map((i) => <li key={i}>✓ {i}</li>)}
            </ul>
          </div>
        )}

        {/* footer */}
        <div className="mt-7 grid gap-4 border-t-2 border-ink pt-5 text-xs leading-5 text-gray-600 sm:grid-cols-2">
          <div>
            <div className="font-bold text-ink">Emergency contact (24/7)</div>
            {v.emergencyPhone}<br />
            operations@indonesiatourguide.com
          </div>
          <div>
            <div className="font-bold text-ink">Please present this voucher</div>
            Printed or on your phone, to your guide at pickup. Changes: account → My bookings, or WhatsApp us.
          </div>
        </div>

        {v.booking.special_request && (
          <div className="mt-4 rounded-lg bg-sand-50 p-3 text-xs text-gray-600">
            <b>Special requests:</b> {v.booking.special_request}
          </div>
        )}
      </div>
    </div>
  );
}

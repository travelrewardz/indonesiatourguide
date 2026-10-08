import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import SandboxPayButtons from "@/components/SandboxPayButtons";
import { get } from "@/lib/db";
import { webhookSecret } from "@/lib/payments";
import { buildMetadata } from "@/lib/seo";
import { displayMoney } from "@/lib/currency";
import { getDisplayCurrency } from "@/lib/prefs";
import { fmtDate } from "@/lib/format";
import type { Booking, Payment, Tour } from "@/lib/types";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "Secure payment", path: "/pay", noIndex: true });

function sig(data: string): string {
  return crypto.createHmac("sha256", webhookSecret()).update(data).digest("hex");
}

export default async function SandboxPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = get<Payment>("SELECT * FROM payments WHERE id = ?", id);
  if (!payment) notFound();
  const booking = get<Booking>("SELECT * FROM bookings WHERE id = ?", payment.booking_id);
  if (!booking) notFound();
  if (payment.status === "PAID" || booking.payment_status === "PAID") {
    redirect(`/account/bookings/${booking.booking_number}`);
  }
  const tour = get<Tour>("SELECT * FROM tours WHERE id = ?", booking.tour_id);
  const currency = await getDisplayCurrency();

  return (
    <div className="bg-gray-50 py-14">
      <div className="container-x max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-xl">🔒</div>
          <h1 className="font-display mt-3 text-2xl font-medium">Secure checkout</h1>
          <p className="mt-1 text-sm text-gray-500">Payment provider: <b>Sandbox (test mode)</b></p>
        </div>

        <div className="card p-6">
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Booking</dt><dd className="font-mono font-semibold">{booking.booking_number}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-gray-500">Tour</dt><dd className="text-right font-medium">{tour?.title}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Date</dt><dd className="font-medium">{fmtDate(booking.travel_date)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Travellers</dt><dd className="font-medium">{booking.pax}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Customer</dt><dd className="font-medium">{booking.customer_name}</dd></div>
            <div className="mt-3 flex items-baseline justify-between border-t border-gray-100 pt-3">
              <dt className="font-semibold">Amount due</dt>
              <dd className="text-2xl font-bold text-brand-700">{displayMoney(booking.total_price, currency)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <SandboxPayButtons
              paymentId={payment.id}
              paidSignature={sig(`${payment.id}:PAID`)}
              failedSignature={sig(`${payment.id}:FAILED`)}
              bookingUrl={`/account/bookings/${booking.booking_number}`}
              amountLabel={displayMoney(booking.total_price, currency)}
            />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href={`/tours/${tour?.slug ?? ""}`} className="hover:text-brand-600">← Back to tour</Link>
        </p>
      </div>
    </div>
  );
}

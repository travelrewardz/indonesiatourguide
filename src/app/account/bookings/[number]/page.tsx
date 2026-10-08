import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { displayMoney } from "@/lib/currency";
import { getDisplayCurrency } from "@/lib/prefs";
import { cancelBookingFormAction, submitReviewAction } from "@/lib/actions";
import { whatsappLink } from "@/lib/booking";
import { getProvider } from "@/lib/payments";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import type { Booking, Payment, Review, Supplier, Tour, TourOption, User } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ number: string }> };

export default async function BookingDetailPage({ params }: Ctx) {
  const { number } = await params;
  const session = (await getSessionUser())!;
  const booking = get<Booking>("SELECT * FROM bookings WHERE booking_number = ?", number);
  if (!booking) notFound();

  const user = get<User>("SELECT * FROM users WHERE id = ?", session.id);
  if (!user) notFound();
  const isCustomer = booking.customer_id === user.id;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (!isCustomer && !isAdmin) notFound(); // owners & admins only

  const currency = await getDisplayCurrency();
  const tour = get<Tour>("SELECT * FROM tours WHERE id = ?", booking.tour_id)!;
  const option = booking.option_id ? get<TourOption>("SELECT * FROM tour_options WHERE id = ?", booking.option_id) : null;
  const images = all<{ image_url: string }>("SELECT image_url FROM tour_images WHERE tour_id = ? ORDER BY sort_order LIMIT 1", tour.id);
  const supplier = tour.supplier_id ? get<Supplier>("SELECT * FROM suppliers WHERE id = ?", tour.supplier_id) : null;
  const payment = get<Payment>("SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1", booking.id);
  const itinerary = all<{ day: number; time: string | null; title: string; description: string | null }>(
    "SELECT day, time, title, description FROM tour_itinerary WHERE tour_id = ? ORDER BY sort_order, day", tour.id,
  );
  const myReview = get<Review>("SELECT * FROM reviews WHERE booking_id = ?", booking.id);

  let payUrl: string | null = null;
  if (booking.payment_status === "PENDING" && payment) {
    try {
      const intent = await getProvider(payment.provider).createIntent(payment, booking, tour.title);
      payUrl = intent.redirectUrl;
    } catch {
      payUrl = null;
    }
  }

  const steps = [
    { key: "Booked", done: true, at: booking.created_at },
    { key: "Paid", done: booking.payment_status === "PAID" || booking.payment_status === "REFUNDED", at: booking.payment_status === "PAID" ? booking.updated_at : null },
    { key: "Confirmed", done: booking.confirmation_status === "CONFIRMED", at: booking.confirmation_status === "CONFIRMED" ? booking.updated_at : null },
    { key: "Completed", done: booking.booking_status === "COMPLETED", at: booking.booking_status === "COMPLETED" ? booking.updated_at : null },
  ];

  const waMessage = `Hello Indonesia Tour Guide, I have a question about my booking ${booking.booking_number} (${tour.title} on ${fmtDate(booking.travel_date)}).`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* header */}
        <div className="card overflow-hidden">
          <div className="relative h-40 bg-gray-100">
            {images[0] && <Image src={images[0].image_url} alt={tour.title} fill className="object-cover" sizes="100vw" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-5 text-white">
              <div className="font-mono text-xs opacity-80">{booking.booking_number}</div>
              <h1 className="text-xl font-bold">{tour.title}</h1>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div><div className="text-xs uppercase text-gray-400">Travel date</div><div className="font-semibold">{fmtDate(booking.travel_date)}</div></div>
            <div><div className="text-xs uppercase text-gray-400">Travellers</div><div className="font-semibold">{booking.pax} ({booking.adults}A + {booking.children}C)</div></div>
            <div><div className="text-xs uppercase text-gray-400">Option</div><div className="font-semibold">{option?.name ?? "Standard"}</div></div>
            <div><div className="text-xs uppercase text-gray-400">Pickup</div><div className="font-semibold">{booking.pickup_location}</div></div>
            <div><div className="text-xs uppercase text-gray-400">Status</div><div className="font-semibold">{booking.booking_status} · {booking.payment_status}</div></div>
            <div><div className="text-xs uppercase text-gray-400">Total paid</div><div className="font-semibold text-brand-700">{displayMoney(booking.total_price, currency)}</div></div>
          </div>
        </div>

        {/* timeline */}
        <div className="card p-5">
          <h2 className="font-bold">Booking progress</h2>
          <ol className="mt-4 flex items-center">
            {steps.map((s, i) => (
              <li key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${s.done ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                    {s.done ? "✓" : i + 1}
                  </span>
                  <span className={`mt-1 text-[11px] ${s.done ? "font-semibold text-ink" : "text-gray-400"}`}>{s.key}</span>
                </div>
                {i < steps.length - 1 && <span className={`mx-2 mb-4 h-0.5 flex-1 ${steps[i + 1].done ? "bg-brand-500" : "bg-gray-200"}`} />}
              </li>
            ))}
          </ol>
          {booking.booking_status === "PENDING" && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Awaiting {booking.payment_status === "PENDING" ? "payment" : "confirmation"} — our team confirms within a few hours.
            </p>
          )}
          {booking.booking_status === "CANCELLED" && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              This booking was cancelled. Any refund goes back to your original payment method.
            </p>
          )}
        </div>

        {/* voucher */}
        <div className="card p-5">
          <h2 className="font-bold">Voucher & documents</h2>
          <p className="mt-1 text-sm text-gray-600">Show your QR voucher to your guide at pickup.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/account/bookings/${booking.booking_number}/voucher`} className="btn-primary btn-sm">Open voucher</Link>
            <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm border-green-500 text-green-700">💬 WhatsApp support</a>
            <Link href={`/tours/${tour.slug}`} className="btn-ghost btn-sm">Tour details</Link>
          </div>
        </div>

        {/* itinerary */}
        {itinerary.length > 0 && (
          <div className="card p-5">
            <h2 className="font-bold">Itinerary</h2>
            <ol className="mt-3 space-y-3">
              {itinerary.map((item) => (
                <li key={`${item.day}-${item.title}`} className="flex gap-3 text-sm">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{item.day}</span>
                  <div>
                    <div className="font-semibold">{item.title} {item.time && <span className="ml-1 font-normal text-gray-400">· {item.time}</span>}</div>
                    <div className="text-gray-600">{item.description}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* review */}
        {booking.booking_status === "COMPLETED" && (
          <div className="card p-5" id="review">
            <h2 className="font-bold">Review this tour</h2>
            {myReview ? (
              <p className="mt-2 text-sm text-gray-600">
                You rated this tour <b>{"★".repeat(myReview.rating)}</b> — status: {myReview.status}.
                {myReview.status === "PENDING" && " It will appear publicly after moderation."}
              </p>
            ) : (
              <form action={submitReviewAction} className="mt-3 space-y-3">
                <input type="hidden" name="bookingNumber" value={booking.booking_number} />
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium" htmlFor="rating">Rating</label>
                  <select id="rating" name="rating" className="input w-28" defaultValue="5">
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                  </select>
                </div>
                <textarea name="review" rows={3} className="input" placeholder="How was your guide, trip and organisation?" />
                <button type="submit" className="btn-primary btn-sm">Submit review</button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* sidebar */}
      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-2xl font-bold text-brand-700">{displayMoney(booking.total_price, currency)}</span>
          </div>
          <div className="mt-1 text-xs text-gray-400">Payment: {booking.payment_status} {payment?.transaction_id ? `· ${payment.transaction_id}` : ""}</div>

          <div className="mt-4 space-y-2">
            {payUrl && booking.booking_status !== "CANCELLED" && (
              <a href={payUrl} className="btn-accent w-full">Complete payment</a>
            )}
            {booking.booking_status === "CONFIRMED" && (
              <Link href={`/account/bookings/${booking.booking_number}/voucher`} className="btn-primary w-full">Download voucher</Link>
            )}
            {(booking.booking_status === "PENDING" || booking.booking_status === "CONFIRMED") && (
              <form action={cancelBookingFormAction}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <ConfirmSubmit confirmText="Cancel this booking? Refund rules from the cancellation policy apply.">
                  Cancel booking
                </ConfirmSubmit>
              </form>
            )}
          </div>
        </div>

        <div className="card p-5 text-sm">
          <h3 className="font-bold">Supplier</h3>
          {supplier ? (
            <div className="mt-2 space-y-1 text-gray-600">
              <div className="font-medium text-ink">{supplier.company_name}</div>
              <div>{supplier.phone}</div>
              <div className="text-xs">License {supplier.license_number ?? "—"}</div>
            </div>
          ) : (
            <p className="mt-2 text-gray-600">Operated by our in-house team.</p>
          )}
          <hr className="my-3" />
          <h3 className="font-bold">Need help?</h3>
          <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer" className="mt-2 block font-medium text-green-700 hover:underline">
            💬 Chat on WhatsApp
          </a>
          <Link href="/contact" className="mt-1 block font-medium text-brand-600 hover:underline">Contact support →</Link>
        </div>
      </aside>
    </div>
  );
}

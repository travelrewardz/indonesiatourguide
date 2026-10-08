import { get, run, tx, newId, nowIso } from "./db";
import { BookingError, holdSlots, releaseSlots } from "./availability";
export { BookingError } from "./availability";
import { computePrice, getOptions, getTourBySlug, getTourById, type PriceBreakdown } from "./pricing";
import { onBookingCancelled, onBookingCreated, deliverEmails } from "./notify";
import { emails, queueEmail } from "./email";
import type { Booking, TourOption, User } from "./types";

/**
 * Booking engine. All money math and inventory mutation happens server-side
 * inside a single write transaction (BEGIN IMMEDIATE), so concurrent checkouts
 * serialize and can never overbook a date.
 */

export type CreateBookingInput = {
  tourSlug: string;
  optionId?: string | null;
  travelDate: string;
  adults: number;
  children: number;
  pickupLocation: string;
  hotel?: string;
  specialRequest?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentProvider: "sandbox" | "midtrans" | "bank_transfer";
  user?: { id: string; role: string } | null;
};

export type CreateBookingResult = {
  booking: Booking;
  pricing: PriceBreakdown;
  provider: string;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextBookingNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const row = get<{ c: number }>(
    "SELECT COUNT(*) AS c FROM bookings WHERE booking_number LIKE ?", `ITG-${stamp}-%`,
  );
  const seq = String((row?.c ?? 0) + 1).padStart(5, "0");
  return `ITG-${stamp}-${seq}`;
}

export function createBooking(input: CreateBookingInput): CreateBookingResult {
  const pax = input.adults + input.children;
  if (pax < 1) throw new BookingError("TOO_FEW", "At least one traveller is required.");
  if (input.travelDate < today()) throw new BookingError("PAST_DATE", "Travel date must be in the future.");

  return tx(() => {
    const tour = getTourBySlug(input.tourSlug);
    if (!tour || tour.status !== "PUBLISHED") throw new BookingError("NOT_FOUND", "Tour not found.");
    const options = getOptions(tour.id);
    const option: TourOption | null = input.optionId ? options.find((o) => o.id === input.optionId) ?? null : null;
    if (input.optionId && !option) throw new BookingError("NOT_FOUND", "Option not found.");

    const minPax = option?.min_pax ?? tour.min_pax;
    const maxPax = option?.max_pax ?? tour.max_pax;
    if (pax < minPax) throw new BookingError("TOO_FEW", `This tour needs at least ${minPax} traveller(s).`);
    if (pax > maxPax) throw new BookingError("TOO_MANY", `Maximum ${maxPax} travellers per booking — contact us for larger groups.`);

    // ---- pricing (role-aware, always server-side)
    let role: "PUBLIC" | "AGENT" = "PUBLIC";
    let commissionPct = 0;
    if (input.user?.role === "TRAVEL_AGENT") {
      const agent = get<{ id: string; status: string; commission_pct: number }>(
        "SELECT id, status, commission_pct FROM agents WHERE user_id = ?", input.user.id,
      );
      if (agent && agent.status === "APPROVED") {
        role = "AGENT";
        commissionPct = agent.commission_pct;
      }
    }
    const pricing = computePrice({ tour, option, date: input.travelDate, pax, role, commissionPct });

    // ---- inventory hold (atomic)
    holdSlots(tour, option, input.travelDate, pax);

    // ---- customer identity (guest checkout allowed)
    let customerId: string | null = null;
    if (input.user) {
      customerId = input.user.id;
    } else {
      const existing = get<User>("SELECT * FROM users WHERE email = ?", input.customerEmail);
      if (existing) customerId = existing.id;
      else {
        customerId = newId("usr");
        run(
          `INSERT INTO users (id, name, email, phone, country, password_hash, auth_provider, provider_id, role, status, preferred_language, created_at, updated_at)
           VALUES (?, ?, ?, ?, NULL, '', 'credentials', NULL, 'CUSTOMER', 'ACTIVE', 'en', ?, ?)`,
          customerId, input.customerName, input.customerEmail, input.customerPhone ?? null, nowIso(), nowIso(),
        );
      }
    }

    const agentRow = role === "AGENT"
      ? get<{ id: string }>("SELECT id FROM agents WHERE user_id = ?", input.user?.id ?? "")
      : undefined;

    const bookingId = newId("bkg");
    const number = nextBookingNumber();
    run(
      `INSERT INTO bookings (id, booking_number, customer_id, tour_id, option_id, travel_date, pax, adults, children,
        pickup_location, hotel, special_request, total_price, currency, commission, supplier_amount, agent_id, agent_net_total,
        customer_name, customer_email, customer_phone, payment_status, booking_status, confirmation_status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', 'UNCONFIRMED', ?, ?, ?)`,
      bookingId, number, customerId, tour.id, option?.id ?? null, input.travelDate, pax, input.adults, input.children,
      input.pickupLocation, input.hotel ?? null, input.specialRequest ?? null, pricing.total,
      pricing.commission ?? 0, pricing.supplierAmount, agentRow?.id ?? null, pricing.agentNetTotal,
      input.customerName, input.customerEmail, input.customerPhone ?? null,
      role === "AGENT" ? "agent_portal" : "website", nowIso(), nowIso(),
    );

    run(
      `INSERT INTO payments (id, booking_id, provider, amount, currency, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'USD', 'PENDING', ?, ?)`,
      newId("pay"), bookingId, input.paymentProvider, pricing.total, nowIso(), nowIso(),
    );

    // ---- side effects (notifications + queued email)
    const supplier = tour.supplier_id
      ? get<{ user_id: string; company_name: string; commission_pct: number }>(
          "SELECT user_id, company_name, commission_pct FROM suppliers WHERE id = ?", tour.supplier_id,
        )
      : undefined;

    onBookingCreated({
      bookingId, bookingNumber: number, tourTitle: tour.title, travelDate: input.travelDate, pax,
      total: `$${pricing.total.toFixed(2)}`, customerName: input.customerName, customerEmail: input.customerEmail,
      customerId, supplierUserId: supplier?.user_id ?? null, supplierCompany: supplier?.company_name ?? null,
      supplierAmount: `$${pricing.supplierAmount.toFixed(2)}`,
    });

    const booking = get<Booking>("SELECT * FROM bookings WHERE id = ?", bookingId) as Booking;
    void deliverEmails();
    return { booking, pricing, provider: input.paymentProvider };
  });
}

/**
 * Marks the booking paid + confirmed. Called only from verified payment
 * webhooks or the admin "mark as paid" action. Idempotent.
 */
export function confirmPayment(opts: {
  bookingId: string;
  provider: string;
  transactionId?: string;
  payload?: unknown;
}): { changed: boolean } {
  const result = tx(() => {
    const booking = get<Booking>("SELECT * FROM bookings WHERE id = ?", opts.bookingId);
    if (!booking) return { changed: false };
    const payment = get<{ id: string; status: string }>("SELECT id, status FROM payments WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1", booking.id);
    const alreadyPaid = booking.payment_status === "PAID";
    if (payment && payment.status !== "PAID") {
      run(
        "UPDATE payments SET status = 'PAID', transaction_id = ?, payment_date = ?, payload = ?, updated_at = ? WHERE id = ?",
        opts.transactionId ?? payment.id, nowIso(), JSON.stringify(opts.payload ?? {}), nowIso(), payment.id,
      );
    }
    if (!alreadyPaid) {
      run(
        "UPDATE bookings SET payment_status = 'PAID', booking_status = 'CONFIRMED', confirmation_status = 'CONFIRMED', updated_at = ? WHERE id = ?",
        nowIso(), booking.id,
      );
      const tour = getTourById(booking.tour_id);
      const href = `${siteBase()}/account/bookings/${booking.booking_number}`;
      if (booking.customer_id) {
        run(
          "INSERT INTO notifications (id, user_id, type, title, body, link, read_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)",
          newId("ntf"), booking.customer_id, "payment", `Payment received — ${booking.booking_number}`,
          `$${booking.total_price.toFixed(2)} via ${opts.provider}.`, "/account/bookings", nowIso(),
        );
      }
      queueEmail(booking.customer_email, booking.customer_name, `Payment received — ${booking.booking_number}`,
        emails.paymentReceived({ name: booking.customer_name, number: booking.booking_number, total: `$${booking.total_price.toFixed(2)}`, provider: opts.provider, href }));
      queueEmail(booking.customer_email, booking.customer_name, `Confirmed — ${tour?.title ?? "your tour"}`,
        emails.bookingConfirmed({
          name: booking.customer_name, number: booking.booking_number, tour: tour?.title ?? "",
          date: booking.travel_date, pickup: booking.pickup_location ?? "Hotel pickup", href,
        }));
    }
    return { changed: !alreadyPaid };
  });
  if (result.changed) void deliverEmails();
  return result;
}

export function cancelBooking(bookingId: string, reason?: string): void {
  const result = tx(() => {
    const booking = get<Booking>("SELECT * FROM bookings WHERE id = ?", bookingId);
    if (!booking || booking.booking_status === "CANCELLED") return;
    run(
      "UPDATE bookings SET booking_status = 'CANCELLED', payment_status = CASE WHEN payment_status = 'PAID' THEN 'REFUNDED' ELSE payment_status END, updated_at = ? WHERE id = ?",
      nowIso(), booking.id,
    );
    run("UPDATE payments SET status = 'REFUNDED', updated_at = ? WHERE booking_id = ? AND status = 'PAID'", nowIso(), booking.id);
    releaseSlots(booking.tour_id, booking.option_id, booking.travel_date, booking.pax);
    onBookingCancelled({
      bookingNumber: booking.booking_number, customerName: booking.customer_name,
      customerEmail: booking.customer_email, customerId: booking.customer_id, reason,
    });
  });
  void deliverEmails();
  void result;
}

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    get<{ value: string }>("SELECT value FROM settings WHERE key = 'site_url'")?.value ||
    "http://localhost:3000"
  );
}

/** WhatsApp deep link with a prefilled, contextual message. */
export function whatsappLink(message: string): string {
  const num =
    process.env.WHATSAPP_NUMBER ||
    get<{ value: string }>("SELECT value FROM settings WHERE key = 'whatsapp_number'")?.value ||
    "6281234567890";
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

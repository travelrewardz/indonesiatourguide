import { all, get, run, newId, nowIso, tx } from "./db";
import { flushEmailQueue, queueEmail, emails } from "./email";
import type { User } from "./types";

/**
 * Notification center: in-app notifications (bell in the header, per-user),
 * plus transactional email queued in `email_outbox`.
 */

export function notify(userId: string, type: string, title: string, body: string | null, link: string | null): void {
  run(
    "INSERT INTO notifications (id, user_id, type, title, body, link, read_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)",
    newId("ntf"), userId, type, title, body, link, nowIso(),
  );
}

export function notifyRole(role: string, type: string, title: string, body: string | null, link: string | null): void {
  const users = all<{ id: string }>("SELECT id FROM users WHERE role = ? AND status = 'ACTIVE'", role);
  for (const u of users) notify(u.id, type, title, body, link);
}

export function notifyAdmins(type: string, title: string, body: string | null, link: string | null): void {
  const users = all<{ id: string }>("SELECT id FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND status = 'ACTIVE'");
  for (const u of users) notify(u.id, type, title, body, link);
}

export function unreadCount(userId: string): number {
  const row = get<{ c: number }>("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL", userId);
  return row?.c ?? 0;
}

export function markRead(userId: string, id?: string): void {
  if (id) run("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?", nowIso(), id, userId);
  else run("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", nowIso(), userId);
}

/** Sends any queued email if SMTP is configured (no-op otherwise). */
export async function deliverEmails(): Promise<void> {
  try {
    await flushEmailQueue();
  } catch {
    /* mail transport failures must never break a request */
  }
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || get<{ value: string }>("SELECT value FROM settings WHERE key = 'site_url'")?.value || "http://localhost:3000";
}

/** Central side-effects for a new booking: notifications + emails for every party. */
export function onBookingCreated(input: {
  bookingId: string;
  bookingNumber: string;
  tourTitle: string;
  travelDate: string;
  pax: number;
  total: string;
  customerName: string;
  customerEmail: string;
  customerId: string | null;
  supplierUserId: string | null;
  supplierCompany: string | null;
  supplierAmount: string;
}): void {
  const href = `${siteUrl()}/account/bookings/${input.bookingNumber}`;
  const adminHref = `${siteUrl()}/admin/bookings`;

  if (input.customerId) {
    notify(input.customerId, "booking", `Booking received — ${input.bookingNumber}`,
      `${input.tourTitle} on ${input.travelDate} for ${input.pax} travellers.`, "/account/bookings");
  }
  if (input.supplierUserId) {
    notify(input.supplierUserId, "booking", `New booking ${input.bookingNumber}`,
      `${input.tourTitle} — ${input.travelDate}, ${input.pax} pax. Please confirm within 12 hours.`, "/supplier/bookings");
  }
  notifyAdmins("booking", `New booking ${input.bookingNumber}`,
    `${input.tourTitle} — ${input.travelDate}, ${input.pax} pax, ${input.total}.`, adminHref);

  queueEmail(input.customerEmail, input.customerName,
    `Booking received — ${input.bookingNumber}`,
    emails.bookingReceived({
      name: input.customerName, number: input.bookingNumber, tour: input.tourTitle,
      date: input.travelDate, pax: input.pax, total: input.total, href,
    }));

  if (input.supplierCompany) {
    const supplierEmail = get<{ email: string }>("SELECT email FROM suppliers WHERE user_id = ?", input.supplierUserId ?? "");
    if (supplierEmail) {
      queueEmail(supplierEmail.email, input.supplierCompany,
        `New booking ${input.bookingNumber} — ${input.tourTitle}`,
        emails.supplierNewBooking({
          company: input.supplierCompany, number: input.bookingNumber, tour: input.tourTitle,
          date: input.travelDate, pax: input.pax, amount: input.supplierAmount, href: `${siteUrl()}/supplier/bookings`,
        }));
    }
  }
}

/** Called when a payment webhook confirms money arrived. */
export function onPaymentConfirmed(input: {
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerId: string | null;
  tourTitle: string;
  travelDate: string;
  pickup: string;
  total: string;
  provider: string;
}): void {
  const href = `${siteUrl()}/account/bookings/${input.bookingNumber}`;
  if (input.customerId) notify(input.customerId, "payment", `Payment received — ${input.bookingNumber}`, `${input.total} via ${input.provider}.`, "/account/bookings");
  notifyAdmins("payment", `Payment received — ${input.bookingNumber}`, `${input.total} via ${input.provider}.`, `${siteUrl()}/admin/bookings`);

  queueEmail(input.customerEmail, input.customerName, `Payment received — ${input.bookingNumber}`,
    emails.paymentReceived({ name: input.customerName, number: input.bookingNumber, total: input.total, provider: input.provider, href }));

  // Booking is confirmed at the same moment the money lands.
  queueEmail(input.customerEmail, input.customerName, `Confirmed — ${input.tourTitle}`,
    emails.bookingConfirmed({ name: input.customerName, number: input.bookingNumber, tour: input.tourTitle, date: input.travelDate, pickup: input.pickup, href }));
}

export function onBookingCancelled(input: { bookingNumber: string; customerName: string; customerEmail: string; customerId: string | null; reason?: string }): void {
  const href = `${siteUrl()}/account/bookings/${input.bookingNumber}`;
  if (input.customerId) notify(input.customerId, "booking", `Booking cancelled — ${input.bookingNumber}`, input.reason ?? "Cancelled.", "/account/bookings");
  notifyAdmins("booking", `Booking cancelled — ${input.bookingNumber}`, input.reason ?? "Cancelled by customer/admin.", `${siteUrl()}/admin/bookings`);
  queueEmail(input.customerEmail, input.customerName, `Booking cancelled — ${input.bookingNumber}`,
    emails.bookingCancelled({ name: input.customerName, number: input.bookingNumber, reason: input.reason ?? "", href }));
}

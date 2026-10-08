import nodemailer from "nodemailer";
import { run, all, get, newId, nowIso } from "./db";

/**
 * Email system: HTML templates are rendered, queued in `email_outbox`
 * (visible to admins) and delivered through SMTP when SMTP_* env vars exist.
 * Nothing is ever sent from the browser — all mail goes through the server.
 */

type Brand = { company: string; phone: string; email: string; address: string; site: string };

function brand(): Brand {
  const setting = (k: string, fallback: string) =>
    get<{ value: string }>("SELECT value FROM settings WHERE key = ?", k)?.value ?? fallback;
  return {
    company: setting("company_name", "Indonesia Tour Guide"),
    phone: setting("contact_phone", ""),
    email: setting("contact_email", ""),
    address: setting("address", ""),
    site: setting("site_url", "https://indonesiatourguide.com"),
  };
}

export function renderEmail(opts: { heading: string; intro: string; rows?: [string, string][]; ctaLabel?: string; ctaHref?: string; note?: string; footerNote?: string }): string {
  const b = brand();
  const rowsHtml = opts.rows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px">
        ${opts.rows
          .map(
            ([k, v]) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px">${escapeHtml(k)}</td>
            <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#0f172a;text-align:right">${escapeHtml(v)}</td></tr>`,
          )
          .join("")}
      </table>`
    : "";
  const cta = opts.ctaHref
    ? `<p style="margin:22px 0"><a href="${escapeHtml(opts.ctaHref)}" style="background:#c2410c;color:#fff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">${escapeHtml(opts.ctaLabel ?? "View details")}</a></p>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(opts.heading)}</title></head>
<body style="margin:0;background:#f8fafc;font-family:Helvetica,Arial,sans-serif;color:#0f172a">
<div style="max-width:600px;margin:0 auto;padding:24px 14px">
  <div style="background:#0f172a;border-radius:12px 12px 0 0;padding:22px 24px">
    <div style="color:#f97316;font-weight:800;letter-spacing:.12em;font-size:13px;text-transform:uppercase">Indonesia Tour Guide</div>
    <div style="color:#94a3b8;font-size:12px;margin-top:4px">${escapeHtml(b.site)}</div>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(opts.heading)}</h1>
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:0">${escapeHtml(opts.intro)}</p>
    ${rowsHtml}
    ${opts.note ? `<p style="font-size:13px;color:#64748b;background:#f8fafc;padding:12px 14px;border-radius:8px">${escapeHtml(opts.note)}</p>` : ""}
    ${cta}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0">
      ${escapeHtml(b.company)} · ${escapeHtml(b.address)}<br>
      ${escapeHtml(b.phone)} · ${escapeHtml(b.email)}<br>
      ${escapeHtml(opts.footerNote ?? "Need help? Reply to this email or message us on WhatsApp — we reply within a few hours.")}
    </p>
  </div>
</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export type EmailKind =
  | "booking_received" | "payment_received" | "booking_confirmed" | "booking_cancelled"
  | "voucher" | "reminder" | "supplier_new_booking" | "supplier_booking_update"
  | "agent_booking_confirmed" | "enquiry_received" | "welcome" | "generic";

export function queueEmail(to: string, toName: string | null, subject: string, html: string): void {
  run(
    "INSERT INTO email_outbox (id, to_email, to_name, subject, html, status, created_at) VALUES (?, ?, ?, ?, ?, 'QUEUED', ?)",
    newId("eml"), to, toName, subject, html, nowIso(),
  );
}

/** Attempts immediate delivery for queued mail. Safe no-op without SMTP config. */
export async function flushEmailQueue(limit = 10): Promise<number> {
  const host = process.env.SMTP_HOST;
  if (!host) return 0;
  const queued = all<{ id: string; to_email: string; subject: string; html: string }>(
    "SELECT id, to_email, subject, html FROM email_outbox WHERE status = 'QUEUED' ORDER BY created_at LIMIT ?", limit,
  );
  if (!queued.length) return 0;
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  let sent = 0;
  for (const m of queued) {
    try {
      await transport.sendMail({
        from: `"Indonesia Tour Guide" <${process.env.SMTP_USER || "no-reply@indonesiatourguide.com"}>`,
        to: m.to_email, subject: m.subject, html: m.html,
      });
      run("UPDATE email_outbox SET status = 'SENT', sent_at = ?, error = NULL WHERE id = ?", nowIso(), m.id);
      sent += 1;
    } catch (err) {
      run("UPDATE email_outbox SET status = 'FAILED', error = ? WHERE id = ?", String(err).slice(0, 500), m.id);
    }
  }
  return sent;
}

// ------------------------------------------------------------- email builders
export const emails = {
  bookingReceived: (o: { name: string; number: string; tour: string; date: string; pax: number; total: string; href: string }) =>
    renderEmail({
      heading: `Booking received — ${o.number}`,
      intro: `Hi ${o.name}, we've received your booking request. Our operations team confirms every booking within a few hours — you'll get a confirmation email as soon as your date is locked in.`,
      rows: [["Booking number", o.number], ["Tour", o.tour], ["Travel date", o.date], ["Travellers", String(o.pax)], ["Total", o.total]],
      ctaLabel: "View booking", ctaHref: o.href,
      note: "No payment was charged yet unless you completed checkout. Questions? Reply or message us on WhatsApp.",
    }),

  paymentReceived: (o: { name: string; number: string; total: string; provider: string; href: string }) =>
    renderEmail({
      heading: "Payment received",
      intro: `Thanks ${o.name} — your payment for booking ${o.number} has been received and is being reconciled. Your confirmation follows immediately.`,
      rows: [["Booking number", o.number], ["Amount paid", o.total], ["Method", o.provider]],
      ctaLabel: "View booking", ctaHref: o.href,
    }),

  bookingConfirmed: (o: { name: string; number: string; tour: string; date: string; pickup: string; href: string }) =>
    renderEmail({
      heading: `Confirmed — ${o.tour}`,
      intro: `Your booking ${o.number} is confirmed. Everything is arranged: your guide is assigned and your pickup is scheduled.`,
      rows: [["Booking number", o.number], ["Tour", o.tour], ["Travel date", o.date], ["Pickup", o.pickup]],
      ctaLabel: "Download your voucher", ctaHref: o.href,
      note: "Show the voucher (printout or on your phone) to your guide. A WhatsApp reminder arrives the day before departure.",
    }),

  bookingCancelled: (o: { name: string; number: string; reason: string; href: string }) =>
    renderEmail({
      heading: `Booking cancelled — ${o.number}`,
      intro: `Booking ${o.number} has been cancelled.${o.reason ? ` Reason: ${o.reason}` : ""} Any eligible refund is processed to your original payment method within 5–7 business days.`,
      ctaLabel: "View booking", ctaHref: o.href,
    }),

  supplierNewBooking: (o: { company: string; number: string; tour: string; date: string; pax: number; amount: string; href: string }) =>
    renderEmail({
      heading: `New booking — ${o.number}`,
      intro: `${o.company}, you have a new booking. Please confirm availability in your supplier dashboard within 12 hours.`,
      rows: [["Booking number", o.number], ["Tour", o.tour], ["Travel date", o.date], ["Travellers", String(o.pax)], ["Your amount", o.amount]],
      ctaLabel: "Open supplier dashboard", ctaHref: o.href,
    }),

  enquiryReceived: (o: { name: string; subject: string; href?: string }) =>
    renderEmail({
      heading: "We've received your request",
      intro: `Hi ${o.name}, thanks for contacting Indonesia Tour Guide about ${o.subject}. A local planner will reply within 24 hours (Mon–Sat, WITA).`,
      ctaLabel: "Plan another trip", ctaHref: o.href ?? `${brand().site}/contact`,
    }),

  welcome: (o: { name: string; href: string }) =>
    renderEmail({
      heading: "Welcome to Indonesia Tour Guide",
      intro: `Hi ${o.name}, your account is ready. Track bookings, download vouchers and rebook your favourite tours from your dashboard.`,
      ctaLabel: "Open my dashboard", ctaHref: o.href,
    }),
};

import crypto from "crypto";
import { get, run, nowIso } from "../db";
import type { Booking, Payment } from "../types";
import { confirmPayment } from "../booking";

/**
 * Modular payment architecture. Providers implement a tiny interface, so
 * Midtrans, Xendit, Stripe or PayPal can be added without touching booking code.
 *
 * SECURITY: raw card/wallet credentials never touch this database — every
 * provider is tokenized/redirect based. Webhooks are signature-verified before
 * any money state changes, and status transitions only happen server-side.
 */

export type WebhookResult = {
  paymentId: string;
  bookingId: string;
  status: "PAID" | "FAILED" | "REFUNDED";
  transactionId?: string;
  payload?: unknown;
};

export interface PaymentProvider {
  id: string;
  label: string;
  createIntent(payment: Payment, booking: Booking, tourTitle: string): Promise<{ redirectUrl: string }>;
  verifyWebhook(req: Request, bodyText: string): Promise<WebhookResult | null>;
}

// ------------------------------------------------------------------ helpers
export function webhookSecret(): string {
  return process.env.PAYMENT_WEBHOOK_SECRET || process.env.AUTH_SECRET || getWebhookFallback();
}

function getWebhookFallback(): string {
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = 'webhook_secret'");
  if (row) return row.value;
  const secret = cryptoRandom();
  run("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", "webhook_secret", secret, nowIso());
  return secret;
}

function cryptoRandom(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hmacHex(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// ----------------------------------------------------------------- sandbox
/**
 * Local/test provider: renders an internal checkout page that simulates the
 * redirect-return and fires a signed webhook — exercising the exact same
 * webhook path as a real provider (signature check, state transitions,
 * notifications). Never enable in production; set PAYMENT_PROVIDER=midtrans.
 */
const sandbox: PaymentProvider = {
  id: "sandbox",
  label: "Test payment (sandbox)",
  async createIntent(payment) {
    return { redirectUrl: `/pay/sandbox/${payment.id}` };
  },
  async verifyWebhook(_req, bodyText) {
    let body: { paymentId?: string; status?: string; signature?: string; transactionId?: string };
    try {
      body = JSON.parse(bodyText);
    } catch {
      return null;
    }
    if (!body.paymentId || !body.status || !body.signature) return null;
    const expected = hmacHex(`${body.paymentId}:${body.status}`, webhookSecret());
    if (body.signature.length !== expected.length || body.signature !== expected) return null;
    const payment = get<Payment>("SELECT * FROM payments WHERE id = ?", body.paymentId);
    if (!payment) return null;
    if (body.status !== "PAID" && body.status !== "FAILED") return null;
    return {
      paymentId: payment.id,
      bookingId: payment.booking_id,
      status: body.status,
      transactionId: body.transactionId ?? `SBX-${Date.now()}`,
      payload: body,
    };
  },
};

// ---------------------------------------------------------------- midtrans
/**
 * Midtrans Snap (Indonesia's leading gateway). Redirect/tokenized — no card
 * data ever reaches us. Webhook validates the documented SHA-512 signature.
 */
const midtrans: PaymentProvider = {
  id: "midtrans",
  label: "Midtrans (card, bank transfer, GoPay, OVO, QRIS)",
  async createIntent(payment, booking) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY is not configured");
    const base = process.env.MIDTRANS_SANDBOX === "false"
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";
    const api = process.env.MIDTRANS_SANDBOX === "false"
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";

    const res = await fetch(`${api}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: payment.id, gross_amount: payment.amount },
        item_details: [{ id: booking.booking_number, price: payment.amount, quantity: 1, name: "Tour booking" }],
        customer_details: { first_name: booking.customer_name, email: booking.customer_email, phone: booking.customer_phone ?? undefined },
        expiry: { unit: "hours", duration: 24 },
      }),
    });
    const data = (await res.json()) as { token?: string; redirect_url?: string };
    if (!res.ok || !data.token) throw new Error(`Midtrans error: ${JSON.stringify(data).slice(0, 300)}`);
    run("UPDATE payments SET payload = ?, updated_at = ? WHERE id = ?", JSON.stringify({ token: data.token }), nowIso(), payment.id);
    return { redirectUrl: data.redirect_url ?? `${base}/snap/v1/transactions/${data.token}` };
  },
  async verifyWebhook(_req, bodyText) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    let body: {
      order_id?: string; transaction_status?: string; signature_key?: string;
      status_code?: string; gross_amount?: string; fraud_status?: string; transaction_id?: string;
    };
    try {
      body = JSON.parse(bodyText);
    } catch {
      return null;
    }
    if (!body.order_id || !body.signature_key || !serverKey) return null;
    const expected = crypto
      .createHash("sha512")
      .update(body.order_id + (body.status_code ?? "") + (body.gross_amount ?? "") + serverKey)
      .digest("hex");
    if (body.signature_key !== expected) return null;

    const payment = get<Payment>("SELECT * FROM payments WHERE id = ?", body.order_id);
    if (!payment) return null;

    const s = body.transaction_status;
    if ((s === "capture" || s === "settlement") && body.fraud_status !== "deny") {
      return { paymentId: payment.id, bookingId: payment.booking_id, status: "PAID", transactionId: body.transaction_id, payload: body };
    }
    if (s === "deny" || s === "cancel" || s === "expire") {
      return { paymentId: payment.id, bookingId: payment.booking_id, status: "FAILED", transactionId: body.transaction_id, payload: body };
    }
    return null; // pending — acknowledge without state change
  },
};

// ----------------------------------------------------------- bank transfer
/** Manual/offline payment: instructions shown, admin marks as paid. */
const bankTransfer: PaymentProvider = {
  id: "bank_transfer",
  label: "Bank transfer (manual confirmation)",
  async createIntent(_payment, booking) {
    return { redirectUrl: `/account/bookings/${booking.booking_number}?payment=bank_transfer` };
  },
  async verifyWebhook() {
    return null; // confirmed manually by an admin
  },
};

const providers: Record<string, PaymentProvider> = {
  sandbox,
  midtrans,
  bank_transfer: bankTransfer,
};

export function getProvider(id: string): PaymentProvider {
  return providers[id] ?? providers[defaultProviderId()];
}

export function defaultProviderId(): string {
  // Explicit env wins; otherwise production defaults to manual bank transfer
  // (no test gateway in production) while development defaults to sandbox.
  const wanted =
    process.env.PAYMENT_PROVIDER ??
    (process.env.NODE_ENV === "production" ? "bank_transfer" : "sandbox");
  return providers[wanted] ? wanted : "sandbox";
}

export function availableProviders(): PaymentProvider[] {
  const ids = ["sandbox", "midtrans", "bank_transfer"];
  if (!process.env.MIDTRANS_SERVER_KEY) return [providers[defaultProviderId()], providers.bank_transfer].filter((p, i, a) => a.indexOf(p) === i);
  return ids.map((i) => providers[i]);
}

/** Applies a verified webhook result. Idempotent via confirmPayment. */
export function applyWebhook(result: WebhookResult): { changed: boolean } {
  if (result.status === "PAID") {
    return confirmPayment({
      bookingId: result.bookingId,
      provider: "midtrans",
      transactionId: result.transactionId,
      payload: result.payload,
    });
  }
  run("UPDATE payments SET status = 'FAILED', updated_at = ? WHERE id = ? AND status != 'PAID'", nowIso(), result.paymentId);
  run("UPDATE bookings SET payment_status = 'FAILED', updated_at = ? WHERE id = ? AND payment_status = 'PENDING'", nowIso(), result.bookingId);
  return { changed: false };
}

import { NextRequest } from "next/server";
import { applyWebhook, getProvider } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Payment provider webhook. Signature is verified inside each provider before
 * any state change; unverified payloads are rejected with 401 and never touch
 * booking state. Idempotent — replayed webhooks do not double-confirm.
 *
 * POST /api/payments/webhook/{sandbox|midtrans|bank_transfer}
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  let impl;
  try {
    impl = getProvider(provider);
  } catch {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }
  if (impl.id !== provider) return Response.json({ error: "Unknown provider" }, { status: 404 });

  const bodyText = await req.text();
  const result = await impl.verifyWebhook(req, bodyText);
  if (!result) {
    return Response.json({ error: "Invalid signature or payload" }, { status: 401 });
  }
  const applied = applyWebhook(result);
  return Response.json({ ok: true, changed: applied.changed, status: result.status });
}

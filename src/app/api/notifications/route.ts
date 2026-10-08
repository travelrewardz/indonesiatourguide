import { NextRequest } from "next/server";
import { all } from "@/lib/db";
import { requireApi } from "@/lib/auth";
import { markRead, unreadCount } from "@/lib/notify";
import type { Notification } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApi();
  if (auth instanceof Response) return auth;
  const items = all<Notification>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30", auth.id,
  );
  return Response.json({ items, unread: unreadCount(auth.id) });
}

export async function POST(req: NextRequest) {
  const auth = await requireApi();
  if (auth instanceof Response) return auth;
  const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };
  if (body.all || !body.id) markRead(auth.id);
  else markRead(auth.id, body.id);
  return Response.json({ ok: true, unread: 0 });
}

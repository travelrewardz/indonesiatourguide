import { destroySession, isSameOriginRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isSameOriginRequest(req))) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  await destroySession();
  return Response.json({ ok: true });
}

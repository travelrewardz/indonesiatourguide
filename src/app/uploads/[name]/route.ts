import path from "node:path";
import { uploadsDir } from "@/lib/uploads";
import { readFile, stat } from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Extension → media type for files stored by POST /api/uploads. */
const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

const NAME_RE = /^[\w.-]+$/;

/**
 * GET /uploads/[name] — public serving for images uploaded from the admin and
 * supplier editors. Files live in data/uploads (not public/, which Next serves
 * from a manifest fixed at boot), so this route streams them instead — the
 * image optimizer reaches it through Next's internal request handler.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!NAME_RE.test(name) || name.startsWith(".")) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const dir = uploadsDir();
  const filePath = path.resolve(dir, name);
  if (path.dirname(filePath) !== dir) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const type = TYPES[path.extname(name).slice(1).toLowerCase()];
  if (!type) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    const [bytes, info] = await Promise.all([readFile(filePath), stat(filePath)]);
    if (!info.isFile()) throw new Error("not a file");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}

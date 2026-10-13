import { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { uploadsDir } from "@/lib/uploads";
import { requireApi, isSameOriginRequest, rateLimit } from "@/lib/auth";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/uploads — store an image picked from the user's device and return
 * its public URL ("/uploads/<file>"). Used by the admin/supplier editors that
 * previously only accepted pasted image URLs.
 *
 * Restricted to staff roles, same-origin, rate-limited, magic-byte checked and
 * size capped. Files land in data/uploads (next to the SQLite database) and are
 * served by GET /uploads/[name] — public/ only works for files present at
 * server start, so runtime uploads must not go there.
 */
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ascii = (b: Uint8Array, start: number, end: number): string => {
  let out = "";
  for (let i = start; i < end && i < b.length; i++) out += String.fromCharCode(b[i]);
  return out;
};

type Spec = { ext: string; matches: (b: Uint8Array) => boolean };

const ALLOWED: Record<string, Spec> = {
  "image/jpeg": { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", matches: (b) => b[0] === 0x89 && ascii(b, 1, 4) === "PNG" },
  "image/gif": { ext: "gif", matches: (b) => ascii(b, 0, 4).startsWith("GIF8") },
  "image/webp": { ext: "webp", matches: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  "image/avif": { ext: "avif", matches: (b) => ascii(b, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 12)) },
};

const badRequest = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(req: NextRequest) {
  const auth = await requireApi(["ADMIN", "SUPER_ADMIN", "SUPPLIER"]);
  if (auth instanceof Response) return auth;
  if (!(await isSameOriginRequest(req))) {
    return badRequest("Cross-origin request rejected", 403);
  }
  if (!rateLimit(`upload:${auth.id}`, 40, 60 * 60 * 1000)) {
    return badRequest("Too many uploads — try again later", 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Expected a multipart form upload", 400);
  }

  const file = form.get("file");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return badRequest("No file received", 400);
  }
  if (file.size === 0) return badRequest("The selected file is empty", 400);
  if (file.size > MAX_BYTES) return badRequest("Images must be 5 MB or smaller", 413);

  const spec = ALLOWED[file.type];
  if (!spec) {
    return badRequest("Unsupported image type — use JPEG, PNG, WebP, GIF or AVIF", 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!spec.matches(bytes)) {
    return badRequest("That file does not look like a valid image", 400);
  }

  const name = `${Date.now()}-${bytes.length}-${crypto.randomUUID().slice(0, 8)}.${spec.ext}`;

  // Durable object storage when a Vercel Blob store is connected to the
  // project (the dashboard injects BLOB_READ_WRITE_TOKEN). Serverless hosts
  // have no writable disk, so without it uploads would live only in that
  // function's ephemeral /tmp. Local dev and disk-based hosts fall back to
  // the uploads directory next to the database.
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    try {
      const blob = await put(`uploads/${name}`, Buffer.from(bytes), {
        access: "public",
        contentType: file.type,
        token: blobToken,
      });
      return Response.json({ ok: true, url: blob.url }, { status: 201 });
    } catch {
      return badRequest("Could not store the image — try again", 500);
    }
  }

  const dir = uploadsDir();
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes, { flag: "wx" });
  } catch {
    return badRequest("Could not store the image — try again", 500);
  }

  return Response.json({ ok: true, url: `/uploads/${name}` }, { status: 201 });
}

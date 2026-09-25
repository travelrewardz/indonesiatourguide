import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb, writeDb, newId } from "@/lib/db";
import type { Partner } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const get = (k: string) => String(body.get(k) ?? "").trim();

    const companyName = get("companyName");
    const contactName = get("contactName");
    const email = get("email").toLowerCase();
    const password = get("password");
    const country = get("country");

    if (!companyName || !contactName || !email || !password || !country) {
      return NextResponse.redirect(
        new URL("/partners/register?error=All+fields+marked+required+are+mandatory", req.url),
        { status: 303 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.redirect(
        new URL("/partners/register?error=Please+enter+a+valid+email+address", req.url),
        { status: 303 }
      );
    }
    if (password.length < 8) {
      return NextResponse.redirect(
        new URL("/partners/register?error=Password+must+be+at+least+8+characters", req.url),
        { status: 303 }
      );
    }

    const db = readDb();
    if (db.partners.some((p) => p.email === email)) {
      return NextResponse.redirect(
        new URL("/partners/register?error=An+account+with+this+email+already+exists", req.url),
        { status: 303 }
      );
    }

    const partner: Partner = {
      id: newId("p"),
      companyName,
      contactName,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      country,
      phone: get("phone") || undefined,
      website: get("website") || undefined,
      tier: "standard",
      approved: true, // demo: auto-approve. Gate this behind manual review in production.
      createdAt: new Date().toISOString(),
    };
    db.partners.push(partner);
    writeDb(db);

    return NextResponse.redirect(new URL("/partners/login?registered=1", req.url), {
      status: 303,
    });
  } catch {
    return NextResponse.redirect(
      new URL("/partners/register?error=Registration+failed.+Please+try+again", req.url),
      { status: 303 }
    );
  }
}

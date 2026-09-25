import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const email = String(body.get("email") ?? "").trim().toLowerCase();
    const password = String(body.get("password") ?? "");

    const db = readDb();
    const partner = db.partners.find((p) => p.email === email);
    if (!partner || !(await bcrypt.compare(password, partner.passwordHash))) {
      return NextResponse.redirect(
        new URL("/partners/login?error=Invalid+email+or+password", req.url),
        { status: 303 }
      );
    }

    await createSession(partner.id);
    return NextResponse.redirect(new URL("/partners/dashboard", req.url), {
      status: 303,
    });
  } catch {
    return NextResponse.redirect(
      new URL("/partners/login?error=Login+failed.+Please+try+again", req.url),
      { status: 303 }
    );
  }
}

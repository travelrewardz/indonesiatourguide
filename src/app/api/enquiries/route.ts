import { NextResponse } from "next/server";
import { readDb, writeDb, newId } from "@/lib/db";
import type { Enquiry } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const db = readDb();
    const enquiry: Enquiry = {
      id: newId("enq"),
      name,
      email,
      country: body.country ? String(body.country) : undefined,
      tourSlug: body.tourSlug ? String(body.tourSlug) : undefined,
      travelDate: body.travelDate ? String(body.travelDate) : undefined,
      pax: body.pax ? Number(body.pax) : undefined,
      language: body.language ? String(body.language) : undefined,
      message,
      createdAt: new Date().toISOString(),
    };
    db.enquiries.push(enquiry);
    writeDb(db);

    return NextResponse.json({ ok: true, id: enquiry.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}

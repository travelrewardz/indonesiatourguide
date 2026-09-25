import { NextResponse } from "next/server";
import { readDb, writeDb, netRateFor } from "@/lib/db";
import { getSessionPartner } from "@/lib/session";
import { findTour } from "@/data/catalog";
import type { Quote } from "@/lib/types";

export async function POST(req: Request) {
  const partner = await getSessionPartner();
  if (!partner) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tourSlug = String(body.tourSlug ?? "");
  const travelDate = String(body.travelDate ?? "");
  const pax = Math.max(1, Math.min(120, Number(body.pax ?? 1)));
  const language = String(body.language ?? "English");
  const notes = String(body.notes ?? "").slice(0, 2000);

  const tour = findTour(tourSlug);
  if (!tour) {
    return NextResponse.json({ error: "Unknown tour" }, { status: 400 });
  }
  if (!travelDate || isNaN(Date.parse(travelDate))) {
    return NextResponse.json({ error: "Valid travel date required" }, { status: 400 });
  }

  const discountPct = netRateFor(partner.tier);
  const netPerPerson = Math.round(tour.retailPricePerPerson * (1 - discountPct / 100));

  const quote: Quote = {
    id: `q-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    partnerId: partner.id,
    tourSlug,
    travelDate: new Date(travelDate).toISOString(),
    pax,
    language,
    notes,
    netPerPerson,
    netTotal: netPerPerson * pax,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = readDb();
  db.quotes.push(quote);
  writeDb(db);

  return NextResponse.json({ ok: true, id: quote.id }, { status: 201 });
}

export async function PATCH(req: Request) {
  const partner = await getSessionPartner();
  if (!partner) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { quoteId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { quoteId, status } = body;
  const valid: Quote["status"][] = [
    "draft",
    "sent",
    "negotiating",
    "accepted",
    "lost",
  ];
  if (!quoteId || !status || !valid.includes(status as Quote["status"])) {
    return NextResponse.json({ error: "Invalid quote id or status" }, { status: 400 });
  }

  const db = readDb();
  const quote = db.quotes.find(
    (q) => q.id === quoteId && q.partnerId === partner.id
  );
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  quote.status = status as Quote["status"];
  quote.updatedAt = new Date().toISOString();

  // Accepted quotes are converted into a provisional booking so ops can confirm.
  if (quote.status === "accepted") {
    const existing = db.bookings.find((b) => b.quoteId === quote.id);
    if (!existing) {
      const tour = findTour(quote.tourSlug);
      const grossPer = tour ? tour.retailPricePerPerson : quote.netPerPerson;
      db.bookings.push({
        id: `b-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        partnerId: partner.id,
        quoteId: quote.id,
        tourSlug: quote.tourSlug,
        confirmationCode: `ITG-${Math.floor(50000 + Math.random() * 49999)}`,
        travelDate: quote.travelDate,
        pax: quote.pax,
        language: quote.language,
        grossTotal: grossPer * quote.pax,
        netTotal: quote.netTotal,
        status: "options", // ops confirm -> "confirmed"
        createdAt: new Date().toISOString(),
      });
    }
  }

  writeDb(db);
  return NextResponse.json({ ok: true });
}

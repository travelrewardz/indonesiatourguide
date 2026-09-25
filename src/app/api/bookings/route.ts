import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSessionPartner } from "@/lib/session";
import { findTour } from "@/data/catalog";

export async function GET(req: Request) {
  const partner = await getSessionPartner();
  if (!partner) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = readDb();
  const bookings = db.bookings
    .filter((b) => b.partnerId === partner.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    const header = "confirmation,tour,start_date,pax,language,gross_usd,net_usd,margin_usd,status";
    const rows = bookings.map((b) => {
      const tour = findTour(b.tourSlug);
      const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
      return [
        b.confirmationCode,
        tour?.title ?? b.tourSlug,
        b.travelDate.slice(0, 10),
        b.pax,
        b.language,
        b.grossTotal,
        b.netTotal,
        b.grossTotal - b.netTotal,
        b.status,
      ]
        .map(esc)
        .join(",");
    });
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="indonesia-tour-guide-bookings-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ bookings });
}

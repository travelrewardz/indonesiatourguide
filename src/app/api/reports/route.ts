import { NextRequest } from "next/server";
import { all } from "@/lib/db";
import { requireApi } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUERIES: Record<string, { sql: string; header: string }> = {
  month: {
    sql: `SELECT substr(created_at, 1, 7) AS grp, COUNT(*) AS bookings, SUM(pax) AS travellers,
            SUM(CASE WHEN payment_status = 'PAID' THEN total_price ELSE 0 END) AS revenue
          FROM bookings GROUP BY grp ORDER BY grp DESC LIMIT 24`,
    header: "month,bookings,travellers,revenue_usd",
  },
  destination: {
    sql: `SELECT COALESCE(d.name, 'Unassigned') AS grp, COUNT(*) AS bookings, SUM(b.pax) AS travellers,
            SUM(CASE WHEN b.payment_status = 'PAID' THEN b.total_price ELSE 0 END) AS revenue
          FROM bookings b JOIN tours t ON t.id = b.tour_id LEFT JOIN destinations d ON d.id = t.destination_id
          GROUP BY grp ORDER BY revenue DESC LIMIT 50`,
    header: "destination,bookings,travellers,revenue_usd",
  },
  tour: {
    sql: `SELECT t.title AS grp, COUNT(*) AS bookings, SUM(b.pax) AS travellers,
            SUM(CASE WHEN b.payment_status = 'PAID' THEN b.total_price ELSE 0 END) AS revenue
          FROM bookings b JOIN tours t ON t.id = b.tour_id
          GROUP BY grp ORDER BY revenue DESC LIMIT 100`,
    header: "tour,bookings,travellers,revenue_usd",
  },
  supplier: {
    sql: `SELECT COALESCE(s.company_name, 'In-house') AS grp, COUNT(*) AS bookings,
            SUM(CASE WHEN b.payment_status = 'PAID' THEN b.supplier_amount ELSE 0 END) AS supplier_amount
          FROM bookings b JOIN tours t ON t.id = b.tour_id LEFT JOIN suppliers s ON s.id = t.supplier_id
          GROUP BY grp ORDER BY supplier_amount DESC LIMIT 50`,
    header: "supplier,bookings,supplier_amount_usd",
  },
  agent: {
    sql: `SELECT COALESCE(a.company, 'Direct') AS grp, COUNT(*) AS bookings,
            SUM(CASE WHEN b.payment_status = 'PAID' THEN b.commission ELSE 0 END) AS commission
          FROM bookings b LEFT JOIN agents a ON a.id = b.agent_id
          GROUP BY grp ORDER BY commission DESC LIMIT 50`,
    header: "agent,bookings,commission_usd",
  },
  cancellation: {
    sql: `SELECT booking_status AS grp, COUNT(*) AS bookings FROM bookings GROUP BY grp`,
    header: "status,bookings",
  },
};

/** GET /api/reports?type=month|destination|tour|supplier|agent|cancellation[&format=csv] */
export async function GET(req: NextRequest) {
  const auth = await requireApi(["ADMIN", "SUPER_ADMIN"]);
  if (auth instanceof Response) return auth;

  const type = req.nextUrl.searchParams.get("type") ?? "month";
  const q = QUERIES[type];
  if (!q) return Response.json({ error: "Unknown report type" }, { status: 400 });

  const rows = all<Record<string, string | number>>(q.sql);
  const columns = q.header.split(",");

  if (req.nextUrl.searchParams.get("format") === "csv") {
    const lines = rows.map((r) => columns.map((c) => JSON.stringify(r[c] ?? "")).join(","));
    return new Response([q.header, ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="report-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  return Response.json({ columns, rows });
}

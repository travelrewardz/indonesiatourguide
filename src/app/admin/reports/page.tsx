import { all, get } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = Record<string, string | number>;

function Table({ title, columns, rows, csvType }: { title: string; columns: string[]; rows: Row[]; csvType: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-bold">{title}</h2>
        <a href={`/api/reports?type=${csvType}&format=csv`} className="btn-outline btn-sm">⬇ CSV</a>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>{columns.map((c) => <th key={c} className="px-5 py-2.5">{c.replace(/_/g, " ")}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50/70">
              {columns.map((c) => (
                <td key={c} className={`px-5 py-2.5 ${typeof r[c] === "number" ? "tabular-nums" : ""}`}>
                  {typeof r[c] === "number" && c.includes("revenue") || c.includes("amount") || c.includes("commission")
                    ? `$${Number(r[c]).toLocaleString()}`
                    : r[c]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="px-5 py-6 text-center text-gray-400" colSpan={columns.length}>No data yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminReportsPage() {
  const run = (sql: string): Row[] => all<Row>(sql);

  const months = run(`SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS bookings, SUM(pax) AS travellers,
    SUM(CASE WHEN payment_status = 'PAID' THEN total_price ELSE 0 END) AS revenue FROM bookings GROUP BY month ORDER BY month DESC LIMIT 12`);
  const byDestination = run(`SELECT COALESCE(d.name, 'Unassigned') AS destination, COUNT(*) AS bookings, SUM(b.pax) AS travellers,
    SUM(CASE WHEN b.payment_status = 'PAID' THEN b.total_price ELSE 0 END) AS revenue FROM bookings b
    JOIN tours t ON t.id = b.tour_id LEFT JOIN destinations d ON d.id = t.destination_id GROUP BY destination ORDER BY revenue DESC LIMIT 20`);
  const byTour = run(`SELECT t.title AS tour, COUNT(*) AS bookings, SUM(b.pax) AS travellers,
    SUM(CASE WHEN b.payment_status = 'PAID' THEN b.total_price ELSE 0 END) AS revenue FROM bookings b
    JOIN tours t ON t.id = b.tour_id GROUP BY tour ORDER BY revenue DESC LIMIT 20`);
  const bySupplier = run(`SELECT COALESCE(s.company_name, 'In-house') AS supplier, COUNT(*) AS bookings,
    SUM(CASE WHEN b.payment_status = 'PAID' THEN b.supplier_amount ELSE 0 END) AS supplier_amount FROM bookings b
    JOIN tours t ON t.id = b.tour_id LEFT JOIN suppliers s ON s.id = t.supplier_id GROUP BY supplier ORDER BY supplier_amount DESC LIMIT 20`);
  const byAgent = run(`SELECT COALESCE(a.company, 'Direct') AS agent, COUNT(*) AS bookings,
    SUM(CASE WHEN b.payment_status = 'PAID' THEN b.commission ELSE 0 END) AS commission FROM bookings b
    LEFT JOIN agents a ON a.id = b.agent_id GROUP BY agent ORDER BY commission DESC LIMIT 20`);

  const overall = get<{ bookings: number; travellers: number | null; revenue: number | null; avg: number | null; cancelled: number }>(
    `SELECT COUNT(*) AS bookings, SUM(pax) AS travellers,
      SUM(CASE WHEN payment_status = 'PAID' AND booking_status != 'CANCELLED' THEN total_price ELSE 0 END) AS revenue,
      AVG(CASE WHEN payment_status = 'PAID' THEN total_price END) AS avg,
      SUM(CASE WHEN booking_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled FROM bookings`,
  )!;
  const cancellationRate = overall.bookings > 0 ? Math.round(((overall.cancelled ?? 0) / overall.bookings) * 100) : 0;
  const topTour = byTour[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Reports</h1>
        <a href="/api/reports?type=tour&format=csv" className="btn-outline btn-sm">⬇ Export all bookings CSV</a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total bookings", value: String(overall.bookings) },
          { label: "Travellers", value: String(overall.travellers ?? 0) },
          { label: "Revenue", value: `$${Math.round(overall.revenue ?? 0).toLocaleString()}` },
          { label: "Avg booking value", value: `$${Math.round(overall.avg ?? 0).toLocaleString()}` },
          { label: "Cancellation rate", value: `${cancellationRate}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{s.label}</div>
            <div className="mt-1 text-2xl font-bold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      {topTour && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-800">
          🏆 Top-selling tour: <b>{topTour.tour}</b> — {String(topTour.bookings)} bookings, ${Number(topTour.revenue).toLocaleString()} revenue
        </div>
      )}

      <Table title="Sales by month" columns={["month", "bookings", "travellers", "revenue"]} rows={months} csvType="month" />
      <Table title="Sales by destination" columns={["destination", "bookings", "travellers", "revenue"]} rows={byDestination} csvType="destination" />
      <Table title="Sales by tour" columns={["tour", "bookings", "travellers", "revenue"]} rows={byTour} csvType="tour" />
      <Table title="By supplier" columns={["supplier", "bookings", "supplier_amount"]} rows={bySupplier} csvType="supplier" />
      <Table title="By agent (commission)" columns={["agent", "bookings", "commission"]} rows={byAgent} csvType="agent" />

      <p className="text-xs text-gray-500">
        All figures computed live from booking records · last booking {months[0]?.month ?? "—"}. Export uses GET /api/reports?type=…&format=csv.
      </p>
      <span className="hidden" data-count={fmtDate(new Date().toISOString())} />
    </div>
  );
}

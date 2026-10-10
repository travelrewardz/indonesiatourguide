import Link from "next/link";
import { all, get } from "@/lib/db";
import { fmtDate, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const stats = {
    bookings: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings")?.c ?? 0,
    today: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE date(created_at) = ?", today)?.c ?? 0,
    month: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE created_at >= ?", monthStart)?.c ?? 0,
    revenue: get<{ s: number | null }>("SELECT SUM(total_price) AS s FROM bookings WHERE payment_status = 'PAID' AND booking_status != 'CANCELLED'")?.s ?? 0,
    pending: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE booking_status = 'PENDING'")?.c ?? 0,
    confirmed: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE booking_status = 'CONFIRMED'")?.c ?? 0,
    cancelled: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE booking_status = 'CANCELLED'")?.c ?? 0,
    customers: get<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role = 'CUSTOMER'")?.c ?? 0,
    suppliers: get<{ c: number }>("SELECT COUNT(*) AS c FROM suppliers")?.c ?? 0,
    supplierPending: get<{ c: number }>("SELECT COUNT(*) AS c FROM suppliers WHERE verification_status = 'PENDING'")?.c ?? 0,
    agents: get<{ c: number }>("SELECT COUNT(*) AS c FROM agents")?.c ?? 0,
    agentPending: get<{ c: number }>("SELECT COUNT(*) AS c FROM agents WHERE status = 'PENDING'")?.c ?? 0,
    tours: get<{ c: number }>("SELECT COUNT(*) AS c FROM tours")?.c ?? 0,
    destinations: get<{ c: number }>("SELECT COUNT(*) AS c FROM destinations")?.c ?? 0,
    enquiries: get<{ c: number }>("SELECT COUNT(*) AS c FROM enquiries WHERE status = 'NEW'")?.c ?? 0,
    reviews: get<{ c: number }>("SELECT COUNT(*) AS c FROM reviews WHERE status = 'PENDING'")?.c ?? 0,
  };

  const monthly = all<{ month: string; c: number; revenue: number }>(
    `SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS c, COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_price END), 0) AS revenue
     FROM bookings GROUP BY month ORDER BY month DESC LIMIT 6`,
  ).reverse();
  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue));

  const recent = all<{ booking_number: string; title: string; customer_name: string; travel_date: string; total_price: number; booking_status: string; payment_status: string; created_at: string }>(
    `SELECT b.booking_number, t.title, b.customer_name, b.travel_date, b.total_price, b.booking_status, b.payment_status, b.created_at
     FROM bookings b JOIN tours t ON t.id = b.tour_id ORDER BY b.created_at DESC LIMIT 8`,
  );

  return (
    <div className="space-y-6">
      {(stats.pending > 0 || stats.supplierPending > 0 || stats.agentPending > 0 || stats.reviews > 0 || stats.enquiries > 0) && (
        <div className="flex flex-wrap gap-2">
          {[
            { n: stats.pending, label: "pending bookings", href: "/admin/bookings?status=PENDING" },
            { n: stats.enquiries, label: "new enquiries", href: "/admin/enquiries" },
            { n: stats.reviews, label: "reviews to moderate", href: "/admin/reviews" },
            { n: stats.supplierPending, label: "supplier applications", href: "/admin/suppliers" },
            { n: stats.agentPending, label: "agent applications", href: "/admin/agents" },
          ].filter((x) => x.n > 0).map((x) => (
            <Link key={x.label} href={x.href} className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200">
              {x.n} {x.label} →
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total bookings", value: String(stats.bookings) },
          { label: "Today's bookings", value: String(stats.today) },
          { label: "This month", value: String(stats.month) },
          { label: "Revenue (paid)", value: `$${Math.round(stats.revenue).toLocaleString()}` },
          { label: "Pending", value: String(stats.pending) },
          { label: "Confirmed", value: String(stats.confirmed) },
          { label: "Cancelled", value: String(stats.cancelled) },
          { label: "Customers", value: String(stats.customers) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{s.label}</div>
            <div className="mt-1 text-2xl font-bold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* sales chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Sales — last 6 months</h2>
            <Link href="/admin/reports" className="text-xs font-semibold text-brand-600 hover:underline">Full reports →</Link>
          </div>
          <div className="mt-5 flex h-44 items-end gap-3">
            {monthly.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-brand-500/90 transition-all hover:bg-brand-600"
                  style={{ height: `${Math.max(4, (m.revenue / maxRevenue) * 140)}px` }}
                  title={`$${Math.round(m.revenue).toLocaleString()} — ${m.c} bookings`} />
                <div className="text-[10px] text-gray-500">{m.month.slice(5)}</div>
                <div className="text-[10px] font-semibold text-gray-700">${Math.round(m.revenue / 100) / 10}k</div>
              </div>
            ))}
          </div>
        </div>

        {/* entity counts */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">Catalog</h2>
          <div className="mt-3 space-y-2 text-sm">
            {[
              ["Tours", stats.tours, "/admin/tours"],
              ["Destinations", stats.destinations, "/admin/destinations"],
              ["Suppliers", stats.suppliers, "/admin/suppliers"],
              ["Agents", stats.agents, "/admin/agents"],
            ].map(([label, n, href]) => (
              <Link key={String(label)} href={String(href)} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50">
                <span className="text-gray-600">{label}</span>
                <span className="font-bold">{n}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* recent bookings */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-bold">Recent bookings</h2>
          <Link href="/admin/bookings" className="text-xs font-semibold text-brand-600 hover:underline">All bookings →</Link>
        </div>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-2.5">Booking</th><th className="px-5 py-2.5">Tour</th><th className="px-5 py-2.5">Customer</th>
              <th className="px-5 py-2.5">Travel</th><th className="px-5 py-2.5">Total</th><th className="px-5 py-2.5">Status</th><th className="px-5 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recent.map((b) => (
              <tr key={b.booking_number} className="hover:bg-gray-50/70">
                <td className="px-5 py-3 font-mono text-xs">{b.booking_number}</td>
                <td className="px-5 py-3 font-medium">{b.title}</td>
                <td className="px-5 py-3">{b.customer_name}</td>
                <td className="px-5 py-3">{fmtDate(b.travel_date)}</td>
                <td className="px-5 py-3 font-semibold">${b.total_price.toFixed(0)}</td>
                <td className="px-5 py-3">
                  <span className={`badge ${b.booking_status === "CONFIRMED" ? "bg-brand-100 text-brand-700" : b.booking_status === "CANCELLED" ? "bg-red-100 text-red-700" : b.booking_status === "COMPLETED" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-800"}`}>
                    {b.booking_status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-400">{fmtDateTime(b.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { all } from "@/lib/db";
import { setAgentStatusFormAction } from "@/lib/actions";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminAgentsPage() {
  const agents = all<{
    id: string; company: string; contact_person: string; email: string; phone: string | null;
    country: string | null; website: string | null; status: string; commission_pct: number;
    created_at: string; bookings: number; value: number;
  }>(
    `SELECT a.*, (SELECT COUNT(*) FROM bookings b WHERE b.agent_id = a.id) AS bookings,
            COALESCE((SELECT SUM(b.total_price) FROM bookings b WHERE b.agent_id = a.id AND b.payment_status = 'PAID'), 0) AS value
     FROM agents a ORDER BY a.created_at DESC`,
  );

  return (
    <div>
      <h1 className="text-xl font-bold">Travel agents ({agents.length})</h1>
      <div className="mt-4 space-y-3">
        {agents.map((a) => (
          <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{a.company}</span>
                  <span className={`badge ${a.status === "APPROVED" ? "bg-brand-100 text-brand-700" : a.status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                    {a.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{a.contact_person} · {a.email} · {a.phone ?? "—"}</div>
                <div className="text-xs text-gray-400">{a.country}{a.website ? ` · ${a.website}` : ""}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {a.bookings} bookings · ${Math.round(a.value).toLocaleString()} paid value · joined {fmtDate(a.created_at)}
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-3">
                <form action={setAgentStatusFormAction} className="flex items-end gap-2">
                  <input type="hidden" name="agentId" value={a.id} />
                  <div>
                    <label className="label text-xs">Commission %</label>
                    <input name="commission_pct" type="number" min={0} max={50} defaultValue={a.commission_pct} className="input w-24 py-1.5 text-sm" />
                  </div>
                  <select name="status" defaultValue={a.status} className="input w-32 py-1.5 text-sm">
                    {["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button type="submit" className="btn-primary btn-sm">Save</button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {agents.length === 0 && <div className="card p-8 text-center text-sm text-gray-600">No agent registrations yet.</div>}
      </div>
    </div>
  );
}

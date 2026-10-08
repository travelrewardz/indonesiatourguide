import { all } from "@/lib/db";
import { setSupplierStatusFormAction } from "@/lib/actions";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminSuppliersPage() {
  const suppliers = all<{
    id: string; company_name: string; contact_person: string; email: string; phone: string | null;
    address: string | null; destinations: string; license_number: string | null;
    verification_status: string; commission_pct: number; created_at: string; tours: number; bookings: number;
  }>(
    `SELECT s.*, (SELECT COUNT(*) FROM tours t WHERE t.supplier_id = s.id) AS tours,
            (SELECT COUNT(*) FROM bookings b JOIN tours t ON t.id = b.tour_id WHERE t.supplier_id = s.id) AS bookings
     FROM suppliers s ORDER BY s.created_at DESC`,
  );

  return (
    <div>
      <h1 className="text-xl font-bold">Suppliers / operators ({suppliers.length})</h1>
      <div className="mt-4 space-y-3">
        {suppliers.map((s) => (
          <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{s.company_name}</span>
                  <span className={`badge ${s.verification_status === "APPROVED" ? "bg-brand-100 text-brand-700" : s.verification_status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                    {s.verification_status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{s.contact_person} · {s.email} · {s.phone}</div>
                <div className="text-xs text-gray-400">{s.address}</div>
                <div className="mt-1 text-xs text-gray-500">
                  Licence: {s.license_number ?? "—"} · destinations: {s.destinations}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {s.tours} tours · {s.commission_pct}% commission · {s.bookings} bookings · joined {fmtDate(s.created_at)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["APPROVED", "REJECTED", "SUSPENDED"] as const).map((status) => (
                  <form key={status} action={setSupplierStatusFormAction}>
                    <input type="hidden" name="supplierId" value={s.id} />
                    <input type="hidden" name="status" value={status} />
                    <button type="submit" disabled={s.verification_status === status}
                      className={`btn-sm rounded-lg border px-3 text-xs font-semibold disabled:opacity-40 ${
                        status === "APPROVED" ? "border-brand-500 text-brand-700" :
                        status === "SUSPENDED" ? "border-red-300 text-red-600" : "border-gray-300 text-gray-600"
                      }`}>
                      {status === "APPROVED" ? "Approve" : status === "SUSPENDED" ? "Suspend" : "Reject"}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <div className="card p-8 text-center text-sm text-gray-600">No suppliers yet.</div>}
      </div>
    </div>
  );
}

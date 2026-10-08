import { all } from "@/lib/db";
import { setUserStatusFormAction } from "@/lib/actions";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const like = sp.q ? `%${sp.q}%` : null;
  const users = all<{
    id: string; name: string; email: string; phone: string | null; country: string | null;
    role: string; status: string; created_at: string; bookings: number;
  }>(
    `SELECT u.id, u.name, u.email, u.phone, u.country, u.role, u.status, u.created_at,
            (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = u.id) AS bookings
     FROM users u
     ${like ? "WHERE (u.name LIKE ? OR u.email LIKE ?)" : ""}
     ORDER BY u.created_at DESC LIMIT 300`,
    ...(like ? [like, like] : []),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Users ({users.length})</h1>
        <form method="get" className="flex gap-2">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name or email…" className="input w-56 py-1.5 text-sm" />
          <button type="submit" className="btn-outline btn-sm">Search</button>
        </form>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Country</th><th className="px-4 py-3">Bookings</th><th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/70">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-700">{u.role}</span></td>
                <td className="px-4 py-3 text-gray-600">{u.country ?? "—"}</td>
                <td className="px-4 py-3">{u.bookings}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.status === "ACTIVE" ? "bg-brand-100 text-brand-700" : u.status === "SUSPENDED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3">
                  <form action={setUserStatusFormAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="status" value={u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"} />
                    <button type="submit" className={`text-xs font-semibold hover:underline ${u.status === "SUSPENDED" ? "text-brand-600" : "text-red-600"}`}>
                      {u.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

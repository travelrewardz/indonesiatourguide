import { all } from "@/lib/db";
import { setEnquiryStatusFormAction } from "@/lib/actions";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const where: string[] = [];
  const args: string[] = [];
  if (sp.status) {
    where.push("status = ?");
    args.push(sp.status);
  } else {
    where.push("status != 'ARCHIVED'");
  }

  const enquiries = all<{
    id: string; type: string; name: string; email: string; phone: string | null; country: string | null;
    destination: string | null; travel_date: string | null; pax: number | null; budget: string | null;
    interests: string | null; accommodation: string | null; message: string; status: string; created_at: string;
  }>(
    `SELECT * FROM enquiries ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT 200`,
    ...args,
  );

  const typeLabel: Record<string, string> = {
    contact: "Contact message",
    tailor_made: "Tailor-made request",
    quote: "Quote request",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Enquiries ({enquiries.length})</h1>
        <div className="flex gap-2">
          {["", "NEW", "IN_PROGRESS", "RESOLVED", "ARCHIVED"].map((s) => (
            <a key={s || "all"} href={s ? `/admin/enquiries?status=${s}` : "/admin/enquiries"}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${(!sp.status && !s) || sp.status === s ? "bg-ink text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
              {s || "Active"}
            </a>
          ))}
        </div>
      </div>

      {enquiries.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-sm text-gray-600">No enquiries.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {enquiries.map((e) => (
            <div key={e.id} className={`rounded-xl border bg-white p-5 ${e.status === "NEW" ? "border-amber-300" : "border-gray-200"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${e.type === "tailor_made" ? "bg-brand-100 text-brand-700" : e.type === "quote" ? "bg-accent/10 text-accent-dark" : "bg-gray-100 text-gray-700"}`}>
                      {typeLabel[e.type] ?? e.type}
                    </span>
                    <span className={`badge ${e.status === "NEW" ? "bg-amber-100 text-amber-800" : e.status === "RESOLVED" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>
                      {e.status}
                    </span>
                    <span className="text-xs text-gray-400">{fmtDateTime(e.created_at)}</span>
                  </div>
                  <div className="mt-1.5 font-semibold">{e.name} <span className="font-normal text-gray-500">· {e.email}{e.phone ? ` · ${e.phone}` : ""}</span></div>
                  <div className="text-xs text-gray-500">
                    {e.country ? `${e.country} · ` : ""}
                    {e.destination ? `destinations: ${e.destination} · ` : ""}
                    {e.travel_date ? `travel ${e.travel_date} · ` : ""}
                    {e.pax ? `${e.pax} pax · ` : ""}
                    {e.budget ? `budget ${e.budget} · ` : ""}
                    {e.accommodation ? `${e.accommodation}` : ""}
                  </div>
                  <p className="mt-2 max-w-3xl whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">{e.message}</p>
                  {e.interests && <div className="mt-1 text-xs text-gray-500">Interests: {e.interests}</div>}
                </div>
                <form action={setEnquiryStatusFormAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <select name="status" defaultValue={e.status} className="input w-36 py-1.5 text-sm">
                    {["NEW", "IN_PROGRESS", "RESOLVED", "ARCHIVED"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button type="submit" className="btn-outline btn-sm">Set</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

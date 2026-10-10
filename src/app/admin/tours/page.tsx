import Link from "next/link";
import { all } from "@/lib/db";
import { setTourStatusFormAction, deleteTourFormAction } from "@/lib/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { displayMoney } from "@/lib/currency";
import { getDisplayCurrency } from "@/lib/prefs";

export const dynamic = "force-dynamic";

export default async function AdminToursPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const currency = await getDisplayCurrency();
  const where: string[] = [];
  const args: string[] = [];
  if (sp.q) {
    where.push("(t.title LIKE ? OR t.slug LIKE ?)");
    args.push(`%${sp.q}%`, `%${sp.q}%`);
  }
  if (sp.status) {
    where.push("t.status = ?");
    args.push(sp.status);
  }

  const tours = all<{
    id: string; title: string; slug: string; status: string; featured: number;
    base_price: number; sale_price: number | null; rating: number; review_count: number;
    supplier_name: string | null; destination_name: string | null;
  }>(
    `SELECT t.id, t.title, t.slug, t.status, t.featured, t.base_price, t.sale_price, t.rating, t.review_count,
            s.company_name AS supplier_name, d.name AS destination_name
     FROM tours t LEFT JOIN suppliers s ON s.id = t.supplier_id LEFT JOIN destinations d ON d.id = t.destination_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY t.updated_at DESC`,
    ...args,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Tours ({tours.length})</h1>
        <div className="flex gap-2">
          <form method="get" className="flex gap-2">
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Search tours…" className="input w-48 py-1.5 text-sm" />
            <select name="status" defaultValue={sp.status ?? ""} className="input w-36 py-1.5 text-sm">
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>
            <button type="submit" className="btn-outline btn-sm">Filter</button>
          </form>
          <Link href="/admin/tours/new" className="btn-accent btn-sm">+ New tour</Link>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {tours.map((t) => (
          <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-60">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${t.status === "PUBLISHED" ? "bg-brand-100 text-brand-700" : t.status === "DRAFT" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"}`}>{t.status}</span>
                  {t.featured ? <span className="badge bg-accent/10 text-accent-dark">Featured</span> : null}
                  <span className="text-xs text-gray-400">{t.destination_name ?? "—"}</span>
                </div>
                <Link href={`/admin/tours/${t.id}/edit`} className="mt-1 block font-semibold hover:text-brand-600">{t.title}</Link>
                <div className="text-xs text-gray-400">/tours/{t.slug} · {t.supplier_name ?? "no supplier"} · ★ {t.rating.toFixed(1)} ({t.review_count})</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-bold text-brand-700">{displayMoney(t.sale_price ?? t.base_price, currency)}</div>
                <div className="text-xs text-gray-400">base {displayMoney(t.base_price, currency)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/tours/${t.id}/edit`} className="btn-outline btn-sm">Edit</Link>
                <form action={setTourStatusFormAction}>
                  <input type="hidden" name="tourId" value={t.id} />
                  <input type="hidden" name="status" value={t.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED"} />
                  <button type="submit" className="btn-ghost btn-sm">{t.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                </form>
                <Link href={`/tours/${t.slug}`} className="btn-ghost btn-sm">View ↗</Link>
                <form action={deleteTourFormAction}>
                  <input type="hidden" name="tourId" value={t.id} />
                  <ConfirmSubmit confirmText="Delete this tour? Bookings history for it will be blocked from deletion — unpublish instead if bookings exist.">Delete</ConfirmSubmit>
                </form>
              </div>
            </div>
          </div>
        ))}
        {tours.length === 0 && <div className="card p-10 text-center text-sm text-gray-600">No tours match.</div>}
      </div>
    </div>
  );
}

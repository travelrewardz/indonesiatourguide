import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { setTourStatusFormAction, deleteTourFormAction } from "@/lib/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { displayMoney } from "@/lib/currency";
import { getDisplayCurrency } from "@/lib/prefs";

export const dynamic = "force-dynamic";

export default async function SupplierToursPage() {
  const user = (await getSessionUser())!;
  const currency = await getDisplayCurrency();
  const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", user.id);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (!supplier && !isAdmin) return <div className="card p-8">No supplier profile.</div>;

  const tours = all<{ id: string; title: string; slug: string; status: string; featured: number; base_price: number; sale_price: number | null; rating: number; review_count: number }>(
    `SELECT id, title, slug, status, featured, base_price, sale_price, rating, review_count FROM tours
     ${supplier && !isAdmin ? "WHERE supplier_id = ?" : isAdmin && supplier ? "WHERE supplier_id = ?" : ""}
     ORDER BY updated_at DESC`,
    ...(supplier ? [supplier.id] : []),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium">My tours ({tours.length})</h2>
        <Link href="/supplier/tours/new" className="btn-accent">+ Create tour</Link>
      </div>

      {tours.length === 0 ? (
        <div className="card mt-4 p-10 text-center">
          <p className="text-sm text-gray-600">Create your first tour — title, photos, price, itinerary and availability. No code needed.</p>
          <Link href="/supplier/tours/new" className="btn-primary mt-4">Create tour</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {tours.map((t) => (
            <div key={t.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-60">
                <div className="flex items-center gap-2">
                  <span className={`badge ${t.status === "PUBLISHED" ? "bg-brand-100 text-brand-700" : t.status === "DRAFT" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"}`}>
                    {t.status}
                  </span>
                  {t.featured ? <span className="badge bg-accent/10 text-accent-dark">Featured</span> : null}
                </div>
                <div className="mt-1 font-semibold">{t.title}</div>
                <div className="text-xs text-gray-400">/tours/{t.slug} · ★ {t.rating.toFixed(1)} ({t.review_count})</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-brand-700">{displayMoney(t.sale_price ?? t.base_price, currency)}</div>
                <div className="text-xs text-gray-400">base {displayMoney(t.base_price, currency)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/supplier/tours/${t.id}/edit`} className="btn-outline btn-sm">Edit</Link>
                <form action={setTourStatusFormAction}>
                  <input type="hidden" name="tourId" value={t.id} />
                  <input type="hidden" name="status" value={t.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED"} />
                  <button type="submit" className="btn-ghost btn-sm">{t.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                </form>
                <Link href={`/tours/${t.slug}`} className="btn-ghost btn-sm">View ↗</Link>
                {isAdmin && (
                  <form action={deleteTourFormAction}>
                    <input type="hidden" name="tourId" value={t.id} />
                    <ConfirmSubmit confirmText="Delete this tour permanently?">Delete</ConfirmSubmit>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

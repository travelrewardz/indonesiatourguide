import { all } from "@/lib/db";
import { moderateReviewFormAction } from "@/lib/actions";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = sp.status ?? "PENDING";
  const reviews = all<{
    id: string; author_name: string; rating: number; review: string | null;
    status: string; created_at: string; title: string;
  }>(
    `SELECT r.id, r.author_name, r.rating, r.review, r.status, r.created_at, t.title
     FROM reviews r JOIN tours t ON t.id = r.tour_id
     WHERE r.status = ? ORDER BY r.created_at DESC LIMIT 100`, status,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Reviews</h1>
        <div className="flex gap-2">
          {["PENDING", "APPROVED", "REJECTED", "HIDDEN"].map((s) => (
            <a key={s} href={`/admin/reviews?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === s ? "bg-ink text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
              {s}
            </a>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-sm text-gray-600">No {status.toLowerCase()} reviews.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.author_name}</span>
                    <span className="text-accent">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></span>
                    <span className="text-xs text-gray-400">{fmtDate(r.created_at)}</span>
                  </div>
                  <div className="text-sm font-medium text-brand-700">{r.title}</div>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">{r.review}</p>
                </div>
                <div className="flex gap-2">
                  {(["APPROVED", "REJECTED", "HIDDEN"] as const).map((s) => (
                    <form key={s} action={moderateReviewFormAction}>
                      <input type="hidden" name="reviewId" value={r.id} />
                      <input type="hidden" name="status" value={s} />
                      <button type="submit" disabled={r.status === s}
                        className={`btn-sm rounded-lg border px-3 text-xs font-semibold disabled:opacity-40 ${
                          s === "APPROVED" ? "border-brand-500 text-brand-700" :
                          s === "REJECTED" ? "border-red-300 text-red-600" : "border-gray-300 text-gray-600"
                        }`}>
                        {s === "APPROVED" ? "Approve" : s === "REJECTED" ? "Reject" : "Hide"}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-gray-500">Approving a review recalculates the tour&apos;s public rating and review count.</p>
    </div>
  );
}

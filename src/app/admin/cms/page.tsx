import Link from "next/link";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AdminCmsPage() {
  const pages = all<{ id: string; slug: string; title: string; updated_at: string }>(
    "SELECT id, slug, title, updated_at FROM cms_pages ORDER BY slug",
  );
  const posts = all<{ id: string; title: string; slug: string; status: string; category: string | null; published_at: string | null; updated_at: string }>(
    "SELECT id, title, slug, status, category, published_at, updated_at FROM blog_posts ORDER BY updated_at DESC",
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Content (CMS)</h1>
        <Link href="/admin/cms/blog/new" className="btn-accent btn-sm">+ New article</Link>
      </div>

      <section>
        <h2 className="font-bold text-gray-700">Static pages</h2>
        <p className="text-xs text-gray-500">Edit About, Terms and Privacy — changes go live immediately, no code involved.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {pages.map((p) => (
            <Link key={p.id} href={`/admin/cms/${p.slug}`} className="card p-5 transition-shadow hover:shadow-md">
              <div className="font-semibold">{p.title}</div>
              <div className="font-mono text-xs text-gray-400">/{p.slug}</div>
              <div className="mt-2 text-xs text-gray-400">updated {fmtDate(p.updated_at)}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-gray-700">Blog articles ({posts.length})</h2>
        <div className="mt-3 space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <Link href={`/admin/cms/blog/${p.id}`} className="font-semibold hover:text-brand-600">{p.title}</Link>
                <div className="text-xs text-gray-400">/blog/{p.slug} · {p.category ?? "uncategorized"} · {p.published_at ? fmtDate(p.published_at) : "unpublished"}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${p.status === "PUBLISHED" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                <Link href={`/admin/cms/blog/${p.id}`} className="btn-outline btn-sm">Edit</Link>
                <Link href={`/blog/${p.slug}`} className="btn-ghost btn-sm">View ↗</Link>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-sm text-gray-500">No articles yet.</p>}
        </div>
      </section>
    </div>
  );
}

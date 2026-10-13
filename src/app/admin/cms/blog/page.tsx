import Link from "next/link";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * /admin/cms/blog — dedicated Blog tab in the admin sidebar: the list of
 * articles with quick entry points to create (+ New article) or edit (Edit)
 * any post. Static pages (About/Terms/Privacy) stay on the CMS tab.
 */
export default function AdminBlogPage() {
  const posts = all<{
    id: string;
    title: string;
    slug: string;
    status: string;
    category: string | null;
    published_at: string | null;
    updated_at: string;
  }>(
    "SELECT id, title, slug, status, category, published_at, updated_at FROM blog_posts ORDER BY updated_at DESC",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Blog</h1>
          <p className="text-xs text-gray-500">
            Write and edit articles — they appear on <Link href="/blog" className="text-brand-600 underline-offset-2 hover:underline">/blog</Link>.
            Static pages (About/Terms/Privacy) are under CMS.
          </p>
        </div>
        <Link href="/admin/cms/blog/new" className="btn-accent btn-sm">+ New article</Link>
      </div>

      <div className="space-y-2">
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
        {posts.length === 0 && <p className="text-sm text-gray-500">No articles yet — click “+ New article”.</p>}
      </div>
    </div>
  );
}

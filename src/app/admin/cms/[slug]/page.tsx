import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { updateCmsPageAction } from "@/lib/actions";
import type { CmsPage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCmsEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = get<CmsPage>("SELECT * FROM cms_pages WHERE slug = ?", slug);
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold">Edit page: {page.title}</h1>
      <p className="mt-1 text-xs text-gray-500">Markdown supported: ## heading, **bold**, - list, [text](https://…)</p>

      <form action={updateCmsPageAction} className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <input type="hidden" name="slug" value={page.slug} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Title</label>
            <input name="title" defaultValue={page.title} required className="input" />
          </div>
          <div>
            <label className="label">SEO title</label>
            <input name="seo_title" defaultValue={page.seo_title ?? ""} className="input" />
          </div>
        </div>
        <div>
          <label className="label">SEO description</label>
          <textarea name="seo_description" rows={2} defaultValue={page.seo_description ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Content (Markdown)</label>
          <textarea name="content" rows={22} defaultValue={page.content} className="input font-mono text-sm leading-6" />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">Save page</button>
          <span className="text-xs text-gray-400">Public route: /{page.slug}</span>
        </div>
      </form>
    </div>
  );
}

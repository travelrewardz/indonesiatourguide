import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { saveBlogPostFormAction, deleteBlogPostAction } from "@/lib/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import type { BlogPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const post: BlogPost | null = isNew
    ? { id: "", title: "", slug: "", author: "", cover_image: "", content: "", excerpt: "", destination_id: null, category: "", seo_title: null, seo_description: null, status: "DRAFT", published_at: null, created_at: "", updated_at: "" }
    : get<BlogPost>("SELECT * FROM blog_posts WHERE id = ?", id) ?? null;
  if (!post) notFound();

  const destinations = all<{ slug: string; name: string }>("SELECT slug, name FROM destinations ORDER BY sort_order");
  const destSlug = post.destination_id
    ? get<{ slug: string }>("SELECT slug FROM destinations WHERE id = ?", post.destination_id)?.slug ?? ""
    : "";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isNew ? "New article" : "Edit article"}</h1>
        {!isNew && (
          <form action={deleteBlogPostAction}>
            <input type="hidden" name="id" value={post.id} />
            <ConfirmSubmit confirmText="Delete this article?">Delete</ConfirmSubmit>
          </form>
        )}
      </div>

      <form action={saveBlogPostFormAction} className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        {!isNew && <input type="hidden" name="id" value={post.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title *</label>
            <input name="title" defaultValue={post.title} required className="input" />
          </div>
          <div>
            <label className="label">Slug</label>
            <input name="slug" defaultValue={post.slug} className="input" placeholder="auto from title" />
          </div>
          <div>
            <label className="label">Author</label>
            <input name="author" defaultValue={post.author ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Category</label>
            <input name="category" defaultValue={post.category ?? ""} className="input" list="blog-cats" />
            <datalist id="blog-cats">
              {["Destination Guide", "Planning", "Adventure", "Culture", "City Guide"].map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Destination</label>
            <select name="destination_slug" defaultValue={destSlug} className="input">
              <option value="">— none —</option>
              {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Cover image URL</label>
            <input name="cover_image" defaultValue={post.cover_image ?? ""} className="input" placeholder="https://…" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Excerpt</label>
            <textarea name="excerpt" rows={2} defaultValue={post.excerpt ?? ""} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Content (Markdown)</label>
          <textarea name="content" rows={20} defaultValue={post.content} className="input font-mono text-sm leading-6" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={post.status} className="input">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          <div>
            <label className="label">Published date</label>
            <input name="published_at" type="date" defaultValue={(post.published_at ?? "").slice(0, 10)} className="input" />
          </div>
          <div>
            <label className="label">SEO title</label>
            <input name="seo_title" defaultValue={post.seo_title ?? ""} className="input" />
          </div>
          <div className="sm:col-span-3">
            <label className="label">SEO description</label>
            <textarea name="seo_description" rows={2} defaultValue={post.seo_description ?? ""} className="input" />
          </div>
        </div>

        <button type="submit" className="btn-primary">Save article</button>
      </form>
    </div>
  );
}

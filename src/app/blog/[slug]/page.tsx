import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { postBySlug, publishedPosts } from "@/lib/queries";
import { markdownToHtml } from "@/lib/markdown";
import { buildMetadata, breadcrumbLd, blogLd } from "@/lib/seo";
import { fmtDate } from "@/lib/format";
import { all, get } from "@/lib/db";
import type { Tour } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post || post.status !== "PUBLISHED") return buildMetadata({ title: "Article not found", path: `/blog/${slug}`, noIndex: true });
  return buildMetadata({
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    path: `/blog/${post.slug}`,
    image: post.cover_image,
  });
}

export default async function BlogPostPage({ params }: Ctx) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post || post.status !== "PUBLISHED") notFound();

  const others = publishedPosts(6).filter((p) => p.slug !== post.slug).slice(0, 3);
  const related = post.destination_id
    ? all<Tour>("SELECT * FROM tours WHERE destination_id = ? AND status = 'PUBLISHED' ORDER BY featured DESC LIMIT 3", post.destination_id)
    : [];
  const dest = post.destination_id
    ? get<{ name: string; slug: string }>("SELECT name, slug FROM destinations WHERE id = ?", post.destination_id)
    : undefined;

  return (
    <article className="bg-white">
      {post.cover_image && (
        <div className="relative h-64 sm:h-96">
          <Image src={post.cover_image} alt={post.title} fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="container-x max-w-3xl pb-16">
        <nav className="relative -mt-20 z-10 mb-4 flex flex-wrap items-center gap-1 text-sm text-white/80">
          <Link href="/" className="hover:text-accent">Home</Link><span>/</span>
          <Link href="/blog" className="hover:text-accent">Blog</Link><span>/</span>
          <span className="line-clamp-1 max-w-56 text-white">{post.title}</span>
        </nav>

        <div className="text-xs font-bold uppercase tracking-wider text-brand-600">{post.category}</div>
        <h1 className="font-display mt-2 text-3xl font-medium leading-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-3 text-sm text-gray-500">
          By {post.author} · {fmtDate(post.published_at ?? post.created_at)}
        </div>

        <div className="mt-8 text-base [&_h2]:font-display [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_li]:text-gray-700 [&_p]:my-4 [&_p]:leading-8 [&_p]:text-gray-700 [&_strong]:text-ink"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }} />

        {related.length > 0 && (
          <section className="mt-12 rounded-3xl bg-sand-50 p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium">
              Bookable {dest?.name ?? "Indonesia"} tours from this guide
            </h2>
            <ul className="mt-4 space-y-3">
              {related.map((t) => (
                <li key={t.id}>
                  <Link href={`/tours/${t.slug}`} className="group flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm hover:shadow">
                    <div>
                      <div className="font-semibold group-hover:text-brand-700">{t.title}</div>
                      <div className="text-xs text-gray-500">{t.duration_text} · ★ {t.rating.toFixed(1)}</div>
                    </div>
                    <span className="font-bold text-brand-700">From ${Math.min(t.sale_price ?? t.base_price, t.base_price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {others.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-medium">Keep reading</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {others.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="rounded-xl border border-gray-100 p-4 text-sm font-medium hover:border-brand-300 hover:bg-brand-50/40">
                  {p.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <JsonLd data={blogLd({
        title: post.title, path: `/blog/${post.slug}`, date: post.published_at ?? post.created_at,
        author: post.author ?? "Indonesia Tour Guide", image: post.cover_image, description: post.seo_description ?? post.excerpt,
      })} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])} />
    </article>
  );
}

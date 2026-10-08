import Link from "next/link";
import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { markdownToHtml } from "@/lib/markdown";
import type { CmsPage } from "@/lib/types";

/** Renders a database CMS page (about, terms, privacy…) — editable without code changes. */
export default function CmsPageView({ slug, path }: { slug: string; path: string }) {
  const page = get<CmsPage>("SELECT * FROM cms_pages WHERE slug = ?", slug);
  if (!page) notFound();

  return (
    <div className="bg-white">
      <div className="bg-ink py-10 text-white">
        <div className="container-x">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-accent">Home</Link> / {page.title}
          </nav>
          <h1 className="font-display mt-2 text-3xl font-medium sm:text-4xl">{page.title}</h1>
        </div>
      </div>
      <div
        className="container-x max-w-3xl py-12 text-base [&_a]:text-brand-600 [&_a]:underline [&_h2]:font-display [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_li]:text-gray-700 [&_p]:my-4 [&_p]:leading-8 [&_p]:text-gray-700 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(page.content) }}
      />
      <span className="hidden" data-path={path} />
    </div>
  );
}

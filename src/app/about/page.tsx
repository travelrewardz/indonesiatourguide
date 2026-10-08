import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { markdownToHtml } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo";

import { HERO_IMAGE } from "@/data/hero";
import type { CmsPage } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = get<CmsPage>("SELECT * FROM cms_pages WHERE slug = 'about'");
  return buildMetadata({
    title: page?.seo_title ?? page?.title ?? "About us",
    description: page?.seo_description ?? undefined,
    path: "/about",
  });
}

export default function AboutPage() {
  const page = get<CmsPage>("SELECT * FROM cms_pages WHERE slug = 'about'");
  if (!page) notFound();
  const license = get<{ value: string }>("SELECT value FROM settings WHERE key = 'license'")?.value;

  return (
    <div>
      <section className="relative h-64 overflow-hidden sm:h-80">
        <Image src={HERO_IMAGE} alt="Indonesia islands" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="container-x relative flex h-full items-end pb-8 text-white">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent">Who we are</div>
            <h1 className="font-display mt-2 text-4xl font-medium">{page.title}</h1>
          </div>
        </div>
      </section>

      <div className="container-x max-w-4xl py-14">
        <div className="text-sm leading-7 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_p]:my-4 [&_p]:leading-8 [&_p]:text-gray-700 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-gray-700"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(page.content) }} />
        {license && <p className="mt-8 rounded-xl bg-sand-50 p-4 text-sm text-gray-600">Operating licence: {license}</p>}
      </div>
    </div>
  );
}

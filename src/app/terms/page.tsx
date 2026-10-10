import type { Metadata } from "next";
import CmsPageView from "@/components/CmsPageView";
import { get } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import type { CmsPage } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = get<CmsPage>("SELECT * FROM cms_pages WHERE slug = 'terms'");
  return buildMetadata({
    title: page?.seo_title ?? "Terms & Conditions",
    description: page?.seo_description ?? undefined,
    path: "/terms",
  });
}

export default function TermsPage() {
  return <CmsPageView slug="terms" path="/terms" />;
}

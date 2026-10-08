import type { Metadata } from "next";
import CmsPageView from "@/components/CmsPageView";
import { get } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import type { CmsPage } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const page = get<CmsPage>("SELECT * FROM cms_pages WHERE slug = 'privacy'");
  return buildMetadata({
    title: page?.seo_title ?? "Privacy Policy",
    description: page?.seo_description ?? undefined,
    path: "/privacy",
  });
}

export default function PrivacyPage() {
  return <CmsPageView slug="privacy" path="/privacy" />;
}

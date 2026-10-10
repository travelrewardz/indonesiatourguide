"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Analytics layer. Pushes conversion events to window.dataLayer (picked up by
 * Google Tag Manager when NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_GTM_ID are set).
 * Events: page_view, search, tour_view, add_to_booking, checkout_started,
 * payment_completed, whatsapp_click, contact_request.
 */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...params, ts: Date.now() });
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    track("page_view", { page: pathname });
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (!el) return;
      const href = el.getAttribute("href") ?? "";
      if (href.includes("wa.me")) track("whatsapp_click", { href, page: pathname });
      if (el.dataset.analytics === "tour_view") track("tour_view", { href });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  return null;
}

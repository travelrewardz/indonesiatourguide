import type { Metadata } from "next";
import type { Tour } from "./types";

/** SEO helpers: metadata builders and JSON-LD structured data. */

export function absoluteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildMetadata(opts: {
  title?: string;
  description?: string;
  path: string;
  image?: string | null;
  keywords?: string | null;
  noIndex?: boolean;
}): Metadata {
  const title = opts.title ?? "Indonesia Tour Guide — Authentic Indonesia tours with local experts";
  const description =
    opts.description ??
    "Book authentic Indonesia tours across Bali, Java, Komodo, Lombok and beyond — verified local operators, real-time availability and secure online booking.";
  const url = absoluteUrl(opts.path);
  const image = opts.image ?? absoluteUrl("/hero-og.jpg");
  return {
    title,
    description,
    keywords: opts.keywords ?? undefined,
    alternates: { canonical: url },
    robots: opts.noIndex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url, siteName: "Indonesia Tour Guide", images: [{ url: image }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${absoluteUrl("/")}#organization`,
    name: "Indonesia Tour Guide",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    description:
      "Licensed Indonesian destination management company offering tours, treks and sailing trips across the archipelago with verified local operators.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. By Pass Ngurah Rai No. 88, Sanur",
      addressLocality: "Denpasar",
      addressRegion: "Bali",
      addressCountry: "ID",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+62-812-3456-7890",
      contactType: "customer service",
      availableLanguage: ["en", "id", "es", "fr", "de", "it", "nl"],
    },
  };
}

export function localBusinessLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${absoluteUrl("/")}#localbusiness`,
    name: "Indonesia Tour Guide",
    image: absoluteUrl("/icon.svg"),
    url: absoluteUrl("/"),
    telephone: "+62-812-3456-7890",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. By Pass Ngurah Rai No. 88, Sanur",
      addressLocality: "Denpasar",
      addressCountry: "ID",
    },
    openingHours: "Mo-Sa 08:00-18:00",
  };
}

export function tourLd(opts: {
  tour: Tour;
  path: string;
  image?: string | null;
  destinationName?: string | null;
  reviews?: { author: string; rating: number; body: string; date: string }[];
  faqs?: { q: string; a: string }[];
}): Record<string, unknown> {
  const { tour, path } = opts;
  const from = tour.sale_price && tour.sale_price > 0 ? tour.sale_price : tour.base_price;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.short_description ?? undefined,
    url: absoluteUrl(path),
    image: opts.image ?? undefined,
    touristType: "Travellers",
    itinerary: {
      "@type": "ItemList",
      numberOfItems: tour.duration_days,
    },
    offers: {
      "@type": "Offer",
      price: from,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(path),
    },
    provider: { "@id": `${absoluteUrl("/")}#organization` },
    aggregateRating: tour.review_count > 0
      ? { "@type": "AggregateRating", ratingValue: tour.rating, reviewCount: tour.review_count, bestRating: 5 }
      : undefined,
  };
  if (opts.reviews?.length) {
    ld.review = opts.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.body,
      datePublished: r.date,
    }));
  }
  if (opts.faqs?.length) {
    ld.mainEntity = {
      "@type": "FAQPage",
      mainEntity: opts.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
  }
  return ld;
}

export function breadcrumbLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogLd(opts: { title: string; path: string; date: string; author: string; image?: string | null; description?: string | null }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description ?? undefined,
    image: opts.image ?? undefined,
    datePublished: opts.date,
    author: { "@type": "Person", name: opts.author },
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    mainEntityOfPage: absoluteUrl(opts.path),
  };
}

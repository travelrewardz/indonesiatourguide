import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import Image from "next/image";
import { getOptions, getTourBySlug } from "@/lib/pricing";
import { tourImages } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { getDisplayCurrency } from "@/lib/prefs";
import { buildMetadata } from "@/lib/seo";
import { availableProviders } from "@/lib/payments";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  return buildMetadata({
    title: tour ? `Book ${tour.title}` : "Checkout",
    description: "Secure checkout with live availability and server-verified pricing.",
    path: `/book/${slug}`,
    noIndex: true,
  });
}

function pick(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export default async function BookPage({ params, searchParams }: Ctx) {
  const [{ slug }, sp, user, currency] = await Promise.all([params, searchParams, getSessionUser(), getDisplayCurrency()]);
  const tour = getTourBySlug(slug);
  if (!tour || tour.status !== "PUBLISHED") notFound();

  const options = getOptions(tour.id);
  const images = tourImages(tour.id);
  const providers = availableProviders().map((p) => ({ id: p.id, label: p.label }));

  return (
    <div className="bg-gray-50 py-10">
      <div className="container-x">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-600">Home</Link> /{" "}
          <Link href={`/tours/${tour.slug}`} className="hover:text-brand-600">{tour.title}</Link> / Checkout
        </nav>

        <div className="mb-8 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {images[0] && <Image src={images[0].image_url} alt={tour.title} fill className="object-cover" sizes="96px" />}
          </div>
          <div>
            <h1 className="text-xl font-bold">{tour.title}</h1>
            <p className="text-sm text-gray-500">{tour.duration_text} · {tour.region} · ★ {tour.rating.toFixed(1)}</p>
          </div>
        </div>

        <CheckoutForm
          tourSlug={tour.slug}
          tourTitle={tour.title}
          options={options}
          currency={currency}
          minPax={tour.min_pax}
          maxPax={tour.max_pax}
          prefill={{
            option: pick(sp.option),
            date: pick(sp.date),
            adults: Number(pick(sp.adults)) || undefined,
            children: Number(pick(sp.children)) || undefined,
          }}
          user={user ? { name: user.name, email: user.email } : null}
          providers={providers}
        />
      </div>
    </div>
  );
}

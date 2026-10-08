import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { publishedPosts, publishedDestinations } from "@/lib/queries";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Indonesia Travel Blog — Guides, Itineraries & Tips",
  description:
    "Practical Indonesia travel guides: Bali things to do, Bromo sunrise, Komodo seasons, Tumpak Sewu, Borobudur and Yogyakarta — written by local experts.",
  path: "/blog",
});

export default function BlogPage() {
  const posts = publishedPosts(24);
  const destinations = publishedDestinations(true).slice(0, 8);
  const [featured, ...rest] = posts;

  return (
    <div className="bg-gray-50">
      <div className="bg-ink py-12 text-white">
        <div className="container-x">
          <div className="text-sm text-white/60"><Link href="/" className="hover:text-accent">Home</Link> / Blog</div>
          <h1 className="font-display mt-2 text-4xl font-medium">Travel Blog</h1>
          <p className="mt-2 max-w-2xl text-white/70">Field notes from our guides and planners — honest, practical, local.</p>
        </div>
      </div>

      <div className="container-x py-12">
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group grid gap-6 rounded-3xl bg-white p-6 shadow-sm sm:grid-cols-2 sm:items-center">
            <div className="relative h-64 overflow-hidden rounded-2xl sm:h-72">
              {featured.cover_image && (
                <Image src={featured.cover_image} alt={featured.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 50vw" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-600">{featured.category}</div>
              <h2 className="font-display mt-2 text-2xl font-medium group-hover:text-brand-700 sm:text-3xl">{featured.title}</h2>
              <p className="mt-3 leading-7 text-gray-600">{featured.excerpt}</p>
              <div className="mt-4 text-sm text-gray-400">{featured.author} · {fmtDate(featured.published_at ?? featured.created_at)}</div>
              <span className="mt-4 inline-block font-semibold text-brand-600">Read article →</span>
            </div>
          </Link>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card group flex flex-col overflow-hidden">
              <div className="relative h-44 overflow-hidden bg-gray-100">
                {post.cover_image && (
                  <Image src={post.cover_image} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-600">{post.category}</div>
                <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug">{post.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">{post.excerpt}</p>
                <div className="mt-auto pt-4 text-xs text-gray-400">{post.author} · {fmtDate(post.published_at ?? post.created_at)}</div>
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-14 rounded-3xl bg-brand-700 p-8 text-white sm:p-10">
          <h2 className="font-display text-2xl font-medium">Where to next?</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {destinations.map((d) => (
              <Link key={d.slug} href={`/destinations/${d.slug}`} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20">
                {d.name}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
    </div>
  );
}

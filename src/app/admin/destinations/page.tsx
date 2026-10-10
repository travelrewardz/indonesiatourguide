import { all } from "@/lib/db";
import { saveDestinationFormAction, deleteDestinationAction } from "@/lib/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { parseJsonArray } from "@/lib/json";

export const dynamic = "force-dynamic";

function DestinationForm({ d }: { d?: { id: string; name: string; slug: string; region: string | null; tagline: string | null; description: string | null; hero_image: string | null; gallery: string; seo_title: string | null; seo_description: string | null; seo_keywords: string | null; featured: number } }) {
  return (
    <form action={saveDestinationFormAction} className="grid gap-3 sm:grid-cols-2">
      {d && <input type="hidden" name="id" value={d.id} />}
      <div>
        <label className="label">Name *</label>
        <input name="name" required defaultValue={d?.name ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Slug</label>
        <input name="slug" defaultValue={d?.slug ?? ""} className="input" placeholder="auto from name" />
      </div>
      <div>
        <label className="label">Region</label>
        <input name="region" defaultValue={d?.region ?? ""} className="input" placeholder="Leaster Sunda Islands" />
      </div>
      <div>
        <label className="label">Tagline</label>
        <input name="tagline" defaultValue={d?.tagline ?? ""} className="input" placeholder="Island of the Gods" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Description</label>
        <textarea name="description" rows={5} defaultValue={d?.description ?? ""} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Hero image URL</label>
        <input name="hero_image" defaultValue={d?.hero_image ?? ""} className="input" placeholder="https://…" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Gallery URLs <span className="font-normal text-gray-400">(one per line)</span></label>
        <textarea name="gallery" rows={3} defaultValue={parseJsonArray<string>(d?.gallery ?? "[]").join("\n")} className="input font-mono text-xs" />
      </div>
      <div>
        <label className="label">SEO title</label>
        <input name="seo_title" defaultValue={d?.seo_title ?? ""} className="input" />
      </div>
      <div>
        <label className="label">SEO keywords</label>
        <input name="seo_keywords" defaultValue={d?.seo_keywords ?? ""} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">SEO description</label>
        <textarea name="seo_description" rows={2} defaultValue={d?.seo_description ?? ""} className="input" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={!!d?.featured} className="accent-brand-600" />
        Feature on homepage
      </label>
      <div className="flex items-center gap-3 sm:justify-end">
        <button type="submit" className="btn-primary btn-sm">{d ? "Save destination" : "Create destination"}</button>
      </div>
    </form>
  );
}

export default async function AdminDestinationsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const destinations = all<{
    id: string; name: string; slug: string; region: string | null; tagline: string | null;
    description: string | null; hero_image: string | null; gallery: string; seo_title: string | null;
    seo_description: string | null; seo_keywords: string | null; featured: number;
  }>("SELECT * FROM destinations ORDER BY sort_order");

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Destinations ({destinations.length})</h1>

      {sp.error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{sp.error}</div>}
      {sp.saved && <div className="mb-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">Destination saved — public pages updated.</div>}

      <details className="rounded-xl border border-brand-200 bg-brand-50/50 p-5" open={destinations.length === 0}>
        <summary className="cursor-pointer font-semibold text-brand-800">+ New destination</summary>
        <div className="mt-4">
          <DestinationForm />
        </div>
      </details>

      {destinations.map((d) => (
        <details key={d.id} className="rounded-xl border border-gray-200 bg-white p-5">
          <summary className="flex cursor-pointer items-center justify-between">
            <span className="font-semibold">
              {d.name} <span className="ml-2 font-mono text-xs text-gray-400">/destinations/{d.slug}</span>
              {d.featured ? <span className="badge ml-2 bg-accent/10 text-accent-dark">Featured</span> : null}
            </span>
            <span className="text-xs text-gray-400">click to edit</span>
          </summary>
          <div className="mt-4">
            <DestinationForm d={d} />
            <form action={deleteDestinationAction} className="mt-3 text-right">
              <input type="hidden" name="id" value={d.id} />
              <ConfirmSubmit confirmText={`Delete destination ${d.name}? Tours keep existing but lose their link.`}>
                Delete destination
              </ConfirmSubmit>
            </form>
          </div>
        </details>
      ))}
    </div>
  );
}

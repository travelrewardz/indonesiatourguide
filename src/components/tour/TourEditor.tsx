"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { label: string; placeholder?: string };

type EditorState = {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  destination_slug: string;
  region: string;
  duration_days: number;
  duration_text: string;
  category: string;
  difficulty: string;
  min_pax: number;
  max_pax: number;
  base_price: number;
  sale_price: string;
  agent_price: string;
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  featured: boolean;
  pickup_info: string;
  map_lat: string;
  map_lng: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  supplier_id: string;
  highlights: string[];
  includes: string[];
  excludes: string[];
  faqs: { q: string; a: string }[];
  images: { image_url: string; alt_text: string }[];
  itinerary: { day: number; time: string; title: string; description: string }[];
  options: { name: string; price: number; min_pax: number; max_pax: number; duration_text: string; inclusions: string; exclusions: string; is_available: boolean }[];
};

const EMPTY: EditorState = {
  title: "", slug: "", short_description: "", full_description: "", destination_slug: "", region: "",
  duration_days: 1, duration_text: "", category: "", difficulty: "Easy", min_pax: 1, max_pax: 12,
  base_price: 50, sale_price: "", agent_price: "", status: "DRAFT", featured: false, pickup_info: "",
  map_lat: "", map_lng: "", seo_title: "", seo_description: "", seo_keywords: "", supplier_id: "",
  highlights: [], includes: [], excludes: [], faqs: [], images: [{ image_url: "", alt_text: "" }],
  itinerary: [{ day: 1, time: "", title: "", description: "" }],
  options: [],
};

function ListEditor({ title, items, onChange, placeholder }: { title: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div>
      <label className="label">{title} <span className="font-normal text-gray-400">(one per line)</span></label>
      <textarea
        rows={Math.max(3, items.length)}
        className="input font-mono text-sm"
        placeholder={placeholder}
        defaultValue={items.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
      />
    </div>
  );
}

export default function TourEditor({
  tourId, destinations, suppliers, redirectBase,
}: {
  tourId?: string;
  destinations: { slug: string; name: string }[];
  suppliers?: { id: string; company_name: string }[];
  redirectBase: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<EditorState>(EMPTY);
  const [loading, setLoading] = useState(!!tourId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!tourId) return;
    fetch(`/api/manage/tours/${tourId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => {
        const t = data.tour;
        setState({
          ...EMPTY,
          ...t,
          sale_price: t.sale_price == null ? "" : String(t.sale_price),
          agent_price: t.agent_price == null ? "" : String(t.agent_price),
          map_lat: t.map_lat == null ? "" : String(t.map_lat),
          map_lng: t.map_lng == null ? "" : String(t.map_lng),
          images: data.images.length ? data.images.map((i: { image_url: string; alt_text: string | null }) => ({ image_url: i.image_url, alt_text: i.alt_text ?? "" })) : [{ image_url: "", alt_text: "" }],
          itinerary: data.itinerary.length ? data.itinerary.map((i: { day: number; time: string | null; title: string; description: string | null }) => ({ day: i.day, time: i.time ?? "", title: i.title, description: i.description ?? "" })) : [{ day: 1, time: "", title: "", description: "" }],
          options: data.options.map((o: EditorState["options"][number]) => ({
            ...o,
            inclusions: Array.isArray(o.inclusions) ? o.inclusions.join("\n") : "",
            exclusions: Array.isArray(o.exclusions) ? o.exclusions.join("\n") : "",
          })),
          faqs: data.tour.faqs ?? [],
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err.message ?? err));
        setLoading(false);
      });
  }, [tourId]);

  function set<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setDirty(true);
  }

  async function save(publish?: boolean) {
    setSaving(true);
    setError("");
    const payload = {
      ...state,
      sale_price: state.sale_price === "" ? null : Number(state.sale_price),
      agent_price: state.agent_price === "" ? null : Number(state.agent_price),
      map_lat: state.map_lat === "" ? null : Number(state.map_lat),
      map_lng: state.map_lng === "" ? null : Number(state.map_lng),
      status: publish ? "PUBLISHED" : state.status,
      images: state.images.filter((i) => i.image_url.trim()),
      itinerary: state.itinerary.filter((i) => i.title.trim()),
      options: state.options.map((o) => ({
        ...o,
        inclusions: o.inclusions.split("\n").map((s) => s.trim()).filter(Boolean),
        exclusions: o.exclusions.split("\n").map((s) => s.trim()).filter(Boolean),
      })),
    };
    try {
      const res = await fetch(tourId ? `/api/manage/tours/${tourId}` : "/api/tours", {
        method: tourId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push(`${redirectBase}/tours`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  if (loading) return <div className="card p-10 text-center text-gray-500">Loading tour…</div>;

  const inp = "input";
  const num = "input";

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* BASICS */}
      <section className="card p-6">
        <h2 className="font-bold">1 · Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="te-title">Title *</label>
            <input id="te-title" className={inp} value={state.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Bromo Sunrise Tour" />
          </div>
          <div>
            <label className="label" htmlFor="te-slug">URL slug</label>
            <input id="te-slug" className={inp} value={state.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from title" />
          </div>
          <div>
            <label className="label" htmlFor="te-dest">Destination</label>
            <select id="te-dest" className={inp} value={state.destination_slug} onChange={(e) => set("destination_slug", e.target.value)}>
              <option value="">— none —</option>
              {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="te-short">Short description (cards, SEO) *</label>
            <textarea id="te-short" rows={2} className={inp} value={state.short_description} onChange={(e) => set("short_description", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="te-full">Full description *</label>
            <textarea id="te-full" rows={8} className={inp} value={state.full_description} onChange={(e) => set("full_description", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="te-region">Region</label>
            <input id="te-region" className={inp} value={state.region} onChange={(e) => set("region", e.target.value)} placeholder="East Java" />
          </div>
          <div>
            <label className="label" htmlFor="te-cat">Category</label>
            <input id="te-cat" className={inp} list="te-cats" value={state.category} onChange={(e) => set("category", e.target.value)} placeholder="Adventure" />
            <datalist id="te-cats">
              {["Adventure", "Culture", "Nature", "Beach", "Diving", "Trekking", "Family", "Honeymoon", "Luxury", "Wildlife", "Volcano", "Waterfall", "Cycling", "Snorkeling"].map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="te-days">Duration (days) *</label>
            <input id="te-days" type="number" min={1} max={60} className={num} value={state.duration_days} onChange={(e) => set("duration_days", Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="te-dtext">Duration text</label>
            <input id="te-dtext" className={inp} value={state.duration_text} onChange={(e) => set("duration_text", e.target.value)} placeholder="8 hours / 5 days" />
          </div>
          <div>
            <label className="label" htmlFor="te-diff">Difficulty</label>
            <select id="te-diff" className={inp} value={state.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
              {["Easy", "Moderate", "Challenging", "Strenuous"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="te-minpax">Min pax *</label>
            <input id="te-minpax" type="number" min={1} className={num} value={state.min_pax} onChange={(e) => set("min_pax", Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="te-maxpax">Max pax *</label>
            <input id="te-maxpax" type="number" min={1} className={num} value={state.max_pax} onChange={(e) => set("max_pax", Number(e.target.value))} />
          </div>
          {suppliers && (
            <div>
              <label className="label" htmlFor="te-supplier">Supplier</label>
              <select id="te-supplier" className={inp} value={state.supplier_id} onChange={(e) => set("supplier_id", e.target.value)}>
                <option value="">— none —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* PRICING */}
      <section className="card p-6">
        <h2 className="font-bold">2 · Pricing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="te-base">Base price (USD / person) *</label>
            <input id="te-base" type="number" min={0} step="0.01" className={num} value={state.base_price} onChange={(e) => set("base_price", Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="te-sale">Sale price (optional)</label>
            <input id="te-sale" type="number" min={0} step="0.01" className={num} value={state.sale_price} onChange={(e) => set("sale_price", e.target.value)} placeholder="leave empty for no discount" />
          </div>
          <div>
            <label className="label" htmlFor="te-agent">Agent net price (optional)</label>
            <input id="te-agent" type="number" min={0} step="0.01" className={num} value={state.agent_price} onChange={(e) => set("agent_price", e.target.value)} placeholder="B2B net rate" />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">Seasonal pricing rules and per-date capacity are managed under Availability.</p>
      </section>

      {/* OPTIONS */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">3 · Options</h2>
          <button type="button" className="btn-outline btn-sm"
            onClick={() => set("options", [...state.options, { name: "", price: state.base_price, min_pax: state.min_pax, max_pax: state.max_pax, duration_text: "", inclusions: "", exclusions: "", is_available: true }])}>
            + Add option
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">e.g. Private Jeep / Shared Jeep / Private Tour — each with its own price and group size.</p>
        <div className="mt-4 space-y-4">
          {state.options.map((o, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Option {i + 1}</span>
                <button type="button" className="text-xs text-red-600 hover:underline"
                  onClick={() => set("options", state.options.filter((_, j) => j !== i))}>Remove</button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <input className={`${inp} sm:col-span-2`} placeholder="Option name *" value={o.name}
                  onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input type="number" min={0} step="0.01" className={num} placeholder="Price *" value={o.price}
                  onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} />
                <input className={inp} placeholder="Duration (optional)" value={o.duration_text}
                  onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, duration_text: e.target.value } : x)))} />
                <input type="number" min={1} className={num} placeholder="Min pax" value={o.min_pax}
                  onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, min_pax: Number(e.target.value) } : x)))} />
                <input type="number" min={1} className={num} placeholder="Max pax" value={o.max_pax}
                  onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, max_pax: Number(e.target.value) } : x)))} />
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={o.is_available} className="accent-brand-600"
                    onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, is_available: e.target.checked } : x)))} />
                  Bookable
                </label>
                <textarea rows={2} className={`${inp} sm:col-span-4`} placeholder="Extra inclusions (one per line)" value={o.inclusions}
                  onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, inclusions: e.target.value } : x)))} />
              </div>
            </div>
          ))}
          {state.options.length === 0 && <p className="text-sm text-gray-500">No options — the base price will be used directly.</p>}
        </div>
      </section>

      {/* IMAGES */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">4 · Images</h2>
          <button type="button" className="btn-outline btn-sm" onClick={() => set("images", [...state.images, { image_url: "", alt_text: "" }])}>+ Add image</button>
        </div>
        <p className="mt-1 text-xs text-gray-500">Paste image URLs (first image is the card/hero image). Use your own CDN or licensed photos.</p>
        <div className="mt-4 space-y-3">
          {state.images.map((img, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
              <input className={inp} placeholder="https://…" value={img.image_url}
                onChange={(e) => set("images", state.images.map((x, j) => (j === i ? { ...x, image_url: e.target.value } : x)))} />
              <input className={inp} placeholder="Alt text" value={img.alt_text}
                onChange={(e) => set("images", state.images.map((x, j) => (j === i ? { ...x, alt_text: e.target.value } : x)))} />
              <button type="button" className="text-sm text-red-600 hover:underline"
                onClick={() => set("images", state.images.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
        </div>
      </section>

      {/* ITINERARY */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">5 · Itinerary</h2>
          <button type="button" className="btn-outline btn-sm"
            onClick={() => set("itinerary", [...state.itinerary, { day: state.itinerary.length + 1, time: "", title: "", description: "" }])}>
            + Add step
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {state.itinerary.map((item, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[70px_100px_1fr_auto]">
              <input type="number" min={1} className={num} value={item.day}
                onChange={(e) => set("itinerary", state.itinerary.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) } : x)))} />
              <input className={inp} placeholder="08:00" value={item.time}
                onChange={(e) => set("itinerary", state.itinerary.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))} />
              <div className="space-y-2">
                <input className={inp} placeholder="Step title *" value={item.title}
                  onChange={(e) => set("itinerary", state.itinerary.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <textarea rows={2} className={inp} placeholder="Description" value={item.description}
                  onChange={(e) => set("itinerary", state.itinerary.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
              </div>
              <button type="button" className="self-start text-sm text-red-600 hover:underline"
                onClick={() => set("itinerary", state.itinerary.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
        </div>
      </section>

      {/* CONTENT */}
      <section className="card p-6">
        <h2 className="font-bold">6 · Included / excluded / highlights</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ListEditor title="Highlights" items={state.highlights} onChange={(v) => set("highlights", v)} placeholder="Sunrise from Penanjakan\nJeep crossing" />
          <ListEditor title="What's included" items={state.includes} onChange={(v) => set("includes", v)} placeholder="Private transport\nLicensed guide" />
          <ListEditor title="What's excluded" items={state.excludes} onChange={(v) => set("excludes", v)} placeholder="Meals\nTips" />
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="te-pickup">Pickup information</label>
          <textarea id="te-pickup" rows={2} className={inp} value={state.pickup_info} onChange={(e) => set("pickup_info", e.target.value)} />
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="label">FAQs</label>
            <button type="button" className="btn-ghost btn-sm" onClick={() => set("faqs", [...state.faqs, { q: "", a: "" }])}>+ Add FAQ</button>
          </div>
          <div className="space-y-3">
            {state.faqs.map((f, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                <input className={inp} placeholder="Question" value={f.q}
                  onChange={(e) => set("faqs", state.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                <textarea rows={2} className={inp} placeholder="Answer" value={f.a}
                  onChange={(e) => set("faqs", state.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                <button type="button" className="self-start text-sm text-red-600 hover:underline"
                  onClick={() => set("faqs", state.faqs.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="card p-6">
        <h2 className="font-bold">7 · SEO</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="te-seot">SEO title</label>
            <input id="te-seot" className={inp} value={state.seo_title} onChange={(e) => set("seo_title", e.target.value)} maxLength={70} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="te-seod">SEO description</label>
            <textarea id="te-seod" rows={2} className={inp} value={state.seo_description} onChange={(e) => set("seo_description", e.target.value)} maxLength={170} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="te-seok">SEO keywords</label>
            <input id="te-seok" className={inp} value={state.seo_keywords} onChange={(e) => set("seo_keywords", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="te-lat">Map latitude</label>
            <input id="te-lat" className={inp} value={state.map_lat} onChange={(e) => set("map_lat", e.target.value)} placeholder="-7.9425" />
          </div>
          <div>
            <label className="label" htmlFor="te-lng">Map longitude</label>
            <input id="te-lng" className={inp} value={state.map_lng} onChange={(e) => set("map_lng", e.target.value)} placeholder="112.953" />
          </div>
        </div>
      </section>

      {/* PUBLISH */}
      <section className="card p-6">
        <h2 className="font-bold">8 · Publish</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={state.featured} className="accent-brand-600" onChange={(e) => set("featured", e.target.checked)} />
            Feature on homepage
          </label>
          <select className={`${inp} w-44`} value={state.status} onChange={(e) => set("status", e.target.value as EditorState["status"])}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="UNPUBLISHED">Unpublished</option>
          </select>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled={saving} onClick={() => save(false)} className="btn-primary">
            {saving ? "Saving…" : tourId ? "Save changes" : "Create as draft"}
          </button>
          <button type="button" disabled={saving} onClick={() => save(true)} className="btn-accent">
            {saving ? "Saving…" : "Save & publish"}
          </button>
        </div>
        {dirty && <p className="mt-2 text-xs text-amber-600">You have unsaved changes.</p>}
      </section>
    </div>
  );
}

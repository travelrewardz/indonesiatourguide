"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/lib/format";

// One pax tier row. Values stay strings while editing so cleared inputs stay
// clearable; they are coerced (and dropped when incomplete) on save.
type Tier = { label: string; min_pax: string; max_pax: string; price: string };

type OptionRow = {
  name: string;
  description: string;
  price: number;
  min_pax: number;
  max_pax: number;
  duration_text: string;
  inclusions: string;
  exclusions: string;
  is_available: boolean;
  tiers: Tier[];
};

type EditorState = {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  destinations: string[];
  regions: string[];
  categories: string[];
  duration_days: number;
  duration_text: string;
  difficulty: string;
  min_pax: number;
  max_pax: number;
  base_price: number;
  sale_price: string;
  currency: string;
  agent_price: string;
  agent_discount_pct: string;
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
  tiers: Tier[];
  options: OptionRow[];
};

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "SGD", "IDR"];
const CATEGORY_PRESETS = [
  "Adventure", "Culture", "Nature", "Beach", "Diving", "Trekking", "Family",
  "Honeymoon", "Luxury", "Wildlife", "Volcano", "Waterfall", "Cycling", "Snorkeling",
];
const REGION_PRESETS = [
  "Java", "Bali", "Sumatra", "Kalimantan", "Sulawesi", "Nusa Tenggara", "Maluku", "Papua",
];

const EMPTY_TIER: Tier = { label: "", min_pax: "", max_pax: "", price: "" };

const EMPTY: EditorState = {
  title: "", slug: "", short_description: "", full_description: "",
  destinations: [], regions: [], categories: [],
  duration_days: 1, duration_text: "", difficulty: "Easy", min_pax: 1, max_pax: 12,
  base_price: 50, sale_price: "", currency: "USD", agent_price: "", agent_discount_pct: "",
  status: "DRAFT", featured: false, pickup_info: "",
  map_lat: "", map_lng: "", seo_title: "", seo_description: "", seo_keywords: "", supplier_id: "",
  highlights: [], includes: [], excludes: [], faqs: [], images: [{ image_url: "", alt_text: "" }],
  itinerary: [{ day: 1, time: "", title: "", description: "" }],
  tiers: [], options: [],
};

type TierRow = { label: string | null; min_pax: number; max_pax: number | null; price: number };

const rowTier = (t: TierRow): Tier => ({
  label: t.label ?? "",
  min_pax: String(t.min_pax),
  max_pax: t.max_pax == null ? "" : String(t.max_pax),
  price: String(t.price),
});

/** Coerces tier rows for the API; incomplete rows are dropped. */
function cleanTiers(tiers: Tier[]) {
  return tiers
    .filter((t) => t.price !== "" && t.min_pax !== "")
    .map((t) => ({
      label: t.label.trim(),
      min_pax: Number(t.min_pax),
      max_pax: t.max_pax === "" ? null : Number(t.max_pax),
      price: Number(t.price),
    }))
    .filter(
      (t) =>
        Number.isFinite(t.price) && Number.isFinite(t.min_pax) && t.price >= 0 && t.min_pax >= 1 &&
        (t.max_pax == null || (Number.isFinite(t.max_pax) && t.max_pax >= t.min_pax)),
    );
}

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

/** Chip toggles for choosing multiple values (destinations / categories). */
function ChipPicker({
  label, hint, choices, selected, onToggle, onAdd, addPlaceholder, addListId,
}: {
  label: string;
  hint?: string;
  choices: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  onAdd?: (value: string) => void;
  addPlaceholder?: string;
  addListId?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && onAdd && !selected.includes(v)) onAdd(v);
    setDraft("");
  };
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {choices.map((c, i) => {
          const active = selected.includes(c.value);
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onToggle(c.value)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm transition",
                active
                  ? "border-brand-600 bg-brand-50 font-semibold text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
              )}
              title={i === 0 && active ? "Primary — shown first on cards and destinations pages" : undefined}
            >
              {c.label}
              {i === 0 && active && <span className="ml-1 text-xs">★</span>}
            </button>
          );
        })}
      </div>
      {onAdd && (
        <div className="mt-2 flex gap-2">
          <input
            className="input max-w-xs"
            list={addListId}
            value={draft}
            placeholder={addPlaceholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="btn-outline btn-sm" onClick={add}>+ Add</button>
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/** Pax tier ladder editor (shared by the tour-level and per-option ladders). */
function TierEditor({ tiers, onChange }: { tiers: Tier[]; onChange: (v: Tier[]) => void }) {
  const set = (i: number, patch: Partial<Tier>) => onChange(tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  return (
    <div className="space-y-2">
      {tiers.map((t, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_90px_100px_110px_auto]">
          <input className="input" placeholder="Label (optional)" value={t.label} onChange={(e) => set(i, { label: e.target.value })} />
          <input className="input" type="number" min={1} placeholder="Min pax" value={t.min_pax} onChange={(e) => set(i, { min_pax: e.target.value })} />
          <input className="input" type="number" min={1} placeholder="Max (∞)" value={t.max_pax} onChange={(e) => set(i, { max_pax: e.target.value })} />
          <input className="input" type="number" min={0} step="0.01" placeholder="Price *" value={t.price} onChange={(e) => set(i, { price: e.target.value })} />
          <button type="button" className="self-center text-sm text-red-600 hover:underline" onClick={() => onChange(tiers.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <button type="button" className="btn-outline btn-sm" onClick={() => onChange([...tiers, { ...EMPTY_TIER, min_pax: String(tiers.length ? tiers[tiers.length - 1].min_pax : 1) }])}>
        + Add tier
      </button>
    </div>
  );
}

const TABS = [
  { id: "general", label: "General" },
  { id: "content", label: "Highlights & Itinerary" },
  { id: "pricing", label: "Pricing & Availability" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function TourEditor({
  tourId, destinations, suppliers, redirectBase, defaultCurrency,
}: {
  tourId?: string;
  destinations: { slug: string; name: string; region?: string | null }[];
  suppliers?: { id: string; company_name: string }[];
  redirectBase: string;
  defaultCurrency?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<EditorState>(EMPTY);
  const [loading, setLoading] = useState(!!tourId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<TabId>("general");

  useEffect(() => {
    if (tourId) return;
    if (defaultCurrency) setState((s) => ({ ...s, currency: defaultCurrency }));
  }, [tourId, defaultCurrency]);

  useEffect(() => {
    if (!tourId) return;
    fetch(`/api/manage/tours/${tourId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load"))))
      .then((data) => {
        const t = data.tour;
        setState({
          ...EMPTY,
          ...t,
          destinations: Array.isArray(t.destinations) ? t.destinations : [],
          regions: Array.isArray(t.regions) ? t.regions : t.region ? [t.region] : [],
          categories: Array.isArray(t.categories) ? t.categories : t.category ? [t.category] : [],
          sale_price: t.sale_price == null ? "" : String(t.sale_price),
          agent_price: t.agent_price == null ? "" : String(t.agent_price),
          agent_discount_pct: t.agent_discount_pct == null ? "" : String(t.agent_discount_pct),
          map_lat: t.map_lat == null ? "" : String(t.map_lat),
          map_lng: t.map_lng == null ? "" : String(t.map_lng),
          images: data.images.length ? data.images.map((i: { image_url: string; alt_text: string | null }) => ({ image_url: i.image_url, alt_text: i.alt_text ?? "" })) : [{ image_url: "", alt_text: "" }],
          itinerary: data.itinerary.length ? data.itinerary.map((i: { day: number; time: string | null; title: string; description: string | null }) => ({ day: i.day, time: i.time ?? "", title: i.title, description: i.description ?? "" })) : [{ day: 1, time: "", title: "", description: "" }],
          tiers: (data.tiers ?? []).map(rowTier),
          options: data.options.map((o: { description: string | null; tiers?: TierRow[] } & Omit<OptionRow, "description" | "tiers">) => ({
            ...o,
            description: o.description ?? "",
            inclusions: Array.isArray(o.inclusions) ? o.inclusions.join("\n") : "",
            exclusions: Array.isArray(o.exclusions) ? o.exclusions.join("\n") : "",
            tiers: (o.tiers ?? []).map(rowTier),
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

  function toggleMulti(key: "destinations" | "regions" | "categories", value: string) {
    setState((s) => {
      const list = s[key];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...s, [key]: next };
    });
    setDirty(true);
  }

  async function save(publish?: boolean) {
    setSaving(true);
    setError("");
    const payload = {
      ...state,
      // Legacy single-value columns mirror the primary (first) selection.
      destination_slug: state.destinations[0] ?? "",
      region: state.regions[0] ?? "",
      category: state.categories[0] ?? "",
      sale_price: state.sale_price === "" ? null : Number(state.sale_price),
      agent_price: state.agent_price === "" ? null : Number(state.agent_price),
      agent_discount_pct: state.agent_discount_pct === "" ? null : Number(state.agent_discount_pct),
      map_lat: state.map_lat === "" ? null : Number(state.map_lat),
      map_lng: state.map_lng === "" ? null : Number(state.map_lng),
      status: publish ? "PUBLISHED" : state.status,
      images: state.images.filter((i) => i.image_url.trim()),
      itinerary: state.itinerary.filter((i) => i.title.trim()),
      tiers: cleanTiers(state.tiers),
      options: state.options.map((o) => ({
        ...o,
        inclusions: o.inclusions.split("\n").map((s) => s.trim()).filter(Boolean),
        exclusions: o.exclusions.split("\n").map((s) => s.trim()).filter(Boolean),
        tiers: cleanTiers(o.tiers),
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
  const selectedDestinations = destinations.filter((d) => state.destinations.includes(d.slug));
  const regionSuggestions = Array.from(
    new Set([
      ...selectedDestinations.map((d) => d.region).filter(Boolean),
      ...REGION_PRESETS,
      ...state.regions,
    ]),
  ).filter((r) => r && !state.regions.includes(r)) as string[];
  const categoryChoices = Array.from(new Set([...CATEGORY_PRESETS, ...state.categories])).map((c) => ({ value: c, label: c }));

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* TAB BAR */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cx(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t.id ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <>
          {/* BASICS */}
          <section className="card p-6">
            <h2 className="font-bold">Basics</h2>
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
                <label className="label" htmlFor="te-days">Duration (days) *</label>
                <input id="te-days" type="number" min={1} max={60} className={num} value={state.duration_days} onChange={(e) => set("duration_days", Number(e.target.value))} />
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

          {/* MULTI DESTINATION / REGION / CATEGORY */}
          <section className="card p-6">
            <h2 className="font-bold">Destinations, regions &amp; category</h2>
            <div className="mt-4 space-y-5">
              <ChipPicker
                label="Destination (multi-day tours can span several)"
                hint="The first selected destination is the primary one shown on cards and used for destination pages."
                choices={destinations.map((d) => ({ value: d.slug, label: d.name }))}
                selected={state.destinations}
                onToggle={(v) => toggleMulti("destinations", v)}
              />
              <datalist id="te-region-sug">{regionSuggestions.map((r) => <option key={r} value={r} />)}</datalist>
              <ChipPicker
                label="Region (multiple — pick per destination)"
                hint="Suggestions come from the destinations you selected."
                choices={state.regions.map((r) => ({ value: r, label: r }))}
                selected={state.regions}
                onToggle={(v) => toggleMulti("regions", v)}
                onAdd={(v) => toggleMulti("regions", v)}
                addPlaceholder="e.g. East Java"
                addListId="te-region-sug"
              />
              <datalist id="te-cat-sug">{CATEGORY_PRESETS.map((c) => <option key={c} value={c} />)}</datalist>
              <ChipPicker
                label="Category (multiple)"
                choices={categoryChoices}
                selected={state.categories}
                onToggle={(v) => toggleMulti("categories", v)}
                onAdd={(v) => toggleMulti("categories", v)}
                addPlaceholder="e.g. Photography"
                addListId="te-cat-sug"
              />
            </div>
          </section>

          {/* SEO */}
          <section className="card p-6">
            <h2 className="font-bold">SEO</h2>
            <p className="mt-1 text-xs text-amber-700">
              Important: search results use these fields — keep the title under 70 characters and the description under 170.
            </p>
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

          {/* IMAGES */}
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Images</h2>
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
        </>
      )}

      {tab === "content" && (
        <>
          {/* HIGHLIGHTS / INCLUDES / EXCLUDES */}
          <section className="card p-6">
            <h2 className="font-bold">Highlights &amp; included / excluded</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <ListEditor title="Highlights" items={state.highlights} onChange={(v) => set("highlights", v)} placeholder={"Sunrise from Penanjakan\nJeep crossing"} />
              <ListEditor title="What's included" items={state.includes} onChange={(v) => set("includes", v)} placeholder={"Private transport\nLicensed guide"} />
              <ListEditor title="What's excluded" items={state.excludes} onChange={(v) => set("excludes", v)} placeholder={"Meals\nTips"} />
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="te-pickup">Pickup information</label>
              <textarea id="te-pickup" rows={2} className={inp} value={state.pickup_info} onChange={(e) => set("pickup_info", e.target.value)} />
            </div>
          </section>

          {/* ITINERARY */}
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Itinerary</h2>
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

          {/* FAQ */}
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">FAQ</h2>
              <button type="button" className="btn-ghost btn-sm" onClick={() => set("faqs", [...state.faqs, { q: "", a: "" }])}>+ Add FAQ</button>
            </div>
            <div className="mt-4 space-y-3">
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
              {state.faqs.length === 0 && <p className="text-sm text-gray-500">No FAQs yet.</p>}
            </div>
          </section>
        </>
      )}

      {tab === "pricing" && (
        <>
          {/* PRICING */}
          <section className="card p-6">
            <h2 className="font-bold">Pricing</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label" htmlFor="te-currency">Currency</label>
                <select id="te-currency" className={inp} value={state.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="mt-1 text-xs text-gray-400">Defaults to your preferred currency.</p>
              </div>
              <div>
                <label className="label" htmlFor="te-base">Base price (per person) *</label>
                <input id="te-base" type="number" min={0} step="0.01" className={num} value={state.base_price} onChange={(e) => set("base_price", Number(e.target.value))} />
              </div>
              <div>
                <label className="label" htmlFor="te-sale">Sale price (optional)</label>
                <input id="te-sale" type="number" min={0} step="0.01" className={num} value={state.sale_price} onChange={(e) => set("sale_price", e.target.value)} placeholder="used when no tiers apply" />
              </div>
              <div>
                <label className="label" htmlFor="te-agent">Agent net price (optional)</label>
                <input id="te-agent" type="number" min={0} step="0.01" className={num} value={state.agent_price} onChange={(e) => set("agent_price", e.target.value)} placeholder="fixed B2B net rate" />
              </div>
              <div>
                <label className="label" htmlFor="te-agent-pct">Agent / member discount % (optional)</label>
                <input id="te-agent-pct" type="number" min={0} max={100} step="0.5" className={num} value={state.agent_discount_pct} onChange={(e) => set("agent_discount_pct", e.target.value)} placeholder="e.g. 10 — leave empty for none" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Cards show your <b>lowest tier price</b> with the base price struck through. Agent net price wins over the
              percentage; leave both empty when you accept no agent/member discount.
            </p>
          </section>

          {/* TOUR TIERS */}
          <section className="card p-6">
            <h2 className="font-bold">Pax pricing tiers</h2>
            <p className="mt-1 text-xs text-gray-500">
              Group-size breaks for the base product — e.g. 1–2 pax at $100, 3–5 at $90, 6+ at $80. The lowest tier drives
              the card price; checkout charges the tier matching the group size.
            </p>
            <div className="mt-4">
              <TierEditor tiers={state.tiers} onChange={(v) => set("tiers", v)} />
            </div>
            {state.tiers.length === 0 && <p className="mt-2 text-sm text-gray-500">No tiers — base/sale price applies to everyone.</p>}
          </section>

          {/* OPTIONS */}
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Options</h2>
              <button type="button" className="btn-outline btn-sm"
                onClick={() => set("options", [...state.options, { name: "", description: "", price: state.base_price, min_pax: state.min_pax, max_pax: state.max_pax, duration_text: "", inclusions: "", exclusions: "", is_available: true, tiers: [] }])}>
                + Add option
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">e.g. Private Jeep / Shared Jeep — each with a description, price and its own tier ladder.</p>
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
                    <textarea rows={2} className={`${inp} sm:col-span-4`} placeholder="Description (shown on the tour page)" value={o.description}
                      onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
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
                    <textarea rows={2} className={`${inp} sm:col-span-4`} placeholder="Exclusions (one per line)" value={o.exclusions}
                      onChange={(e) => set("options", state.options.map((x, j) => (j === i ? { ...x, exclusions: e.target.value } : x)))} />
                  </div>
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pricing tiers</div>
                    <div className="mt-2">
                      <TierEditor tiers={o.tiers} onChange={(v) => set("options", state.options.map((x, j) => (j === i ? { ...x, tiers: v } : x)))} />
                    </div>
                  </div>
                </div>
              ))}
              {state.options.length === 0 && <p className="text-sm text-gray-500">No options — the base price will be used directly.</p>}
            </div>
          </section>

          {/* AVAILABILITY */}
          <section className="card p-6">
            <h2 className="font-bold">Availability</h2>
            <p className="mt-1 text-sm text-gray-500">
              Per-date capacity, closures and seasonal overrides are managed on the Availability page.
            </p>
            <a href={`${redirectBase}/availability`} className="btn-outline btn-sm mt-3 inline-block">Manage availability →</a>
          </section>
        </>
      )}

      {/* PUBLISH */}
      <section className="card p-6">
        <h2 className="font-bold">Publish</h2>
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

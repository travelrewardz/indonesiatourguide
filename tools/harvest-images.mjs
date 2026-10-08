/**
 * Harvest freely-licensed Indonesia travel photography from Wikimedia Commons.
 * Usage: node tools/harvest-images.mjs "query one" "query two" ...
 * Prints JSON: [{ query, title, url }] (top 6 results per query).
 */
const queries = process.argv.slice(2);
const out = [];
for (const q of queries) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=6` +
    "&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ITGPlatformBuild/1.0" } });
    const json = await res.json();
    const pages = Object.values(json?.query?.pages ?? {});
    pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info?.thumburl) continue;
      if (!/\.(jpg|jpeg|png)$/i.test(p.title)) continue;
      const clean = info.thumburl.split("?")[0];
      out.push({ query: q, title: p.title.replace(/^File:/, ""), url: clean });
    }
  } catch (err) {
    out.push({ query: q, error: String(err) });
  }
}
console.log(JSON.stringify(out, null, 1));

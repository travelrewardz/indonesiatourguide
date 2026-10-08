/** Curate harvested Commons images into a typed registry used by the seed catalog. */
import fs from "fs";

const picks = {
  hero: ["Padar Island, Komodo National Park, Indonesia, 20250822 0929 2659.jpg"],
  bali: ["Tanah Lot, Bali, Indonesia, 20220827 0959 1118.jpg"],
  java: ["Sunrise at Borobudur temple.jpg"],
  yogyakarta: ["Yogyakarta Indonesia Prambanan-temple-complex-02.jpg"],
  bromo: ["Mount Bromo at sunrise, showing its volcanoes and Mount Semeru (background).jpg"],
  ijen: ["Kawah Ijen (48140807781).jpg", "Ijen Craters.jpg"],
  eastJava: ["Tumpak sewu waterfall.jpg", "Air Terjun Tumpak Sewu.jpg"],
  jakarta: ["Jakarta skyline 2.jpg", "Jakarta Panorama.jpg"],
  bandung: ["Tea plantation in Ciwidey, Bandung 2014-08-21.jpg", "Green Tea Plantation, Bandung.jpg"],
  sulawesi: ["Tana Toraja Houses.jpg", "Traditional houses in Tana Toraja.jpg"],
  toraja: ["Traditional houses in Tana Toraja.jpg", "Tana Toraja Houses.jpg"],
  labuanBajo: ["Labuan Bajo Harbor.jpg", "Labuan Bajo Port in The Early Morning.jpg"],
  flores: ["Wae Rebo village, Flores Island, Indonesia, 20250824 0750 3024.jpg", "Wae Rebo village, Flores, Nusa Tengara Timur, Indonesia, 2018.jpg"],
  komodo: ["Varanus komodoensis, Komodo Island, Indonesia, 20250822 1319 2749.jpg", "Komodo dragon (Varanus komodoensis).jpg"],
  lombok: ["Gili Islands & Gunung Rinjiani, Lombok, Indonesia.jpg"],
  gili: ["Gili Islands, Brigantine, Bali Sea, Indonesia.jpg", "Clouds over Lombok Strait, Boats, Gili Islands, West Nusa Tenggara, Indonesia.jpg"],
  nusaPenida: ["Kelingking Beach (T-Rex Bay) of Nusa Penida, Bali (2025) - img 08.jpg", "Kelingking Beach (T-Rex Bay) of Nusa Penida, Bali (2025) - img 06.jpg"],
  rajaAmpat: ["Pulau Piaynemo, Raja Ampat.jpg", "Majestic Raja Ampat.jpg"],
  sumatra: ["Lake Toba from Simalem, North Sumatra.jpg", "Toba zoom.jpg"],
  lakeToba: ["PEMANDANGAN DANAU TOBA DARI AJIBATA.jpg", "Danau Toba - Sumut.jpg"],
  bukitLawang: ["Bukit Lawang, orangutan (6931332671).jpg", "Orangutan Bukit Lawang Sumatra banner.jpg"],
  papua: ["20170903 Papouasie Baliem valley 14.jpg", "Baliem Valley banner.JPG"],
  bunaken: ["Sunset at Bunaken Island, Sulawesi, 2016.jpg"],
  kelimutu: ["KEL - Kelimutu crater lakes in early morning, Flores, Indonesia, 2019.jpg", "KEL - Visitors overlooking Kelimutu crater lakes, Flores, Indonesia, 2019.jpg"],
  rinjani: ["Mount Rinjani Panorama.jpg", "Trekking mount rinjani.jpg"],
  malioboro: ["Malioboro di Waktu Senja-19.jpg", "Malioboro Street, Yogyakarta.JPG"],
  uluwatu: ["Uluwatu Temple Cliff, Bali.jpg", "Cliffs of Uluwatu, Bali, Indonesia, 20220826 1006 1038.jpg"],
  besakih: ["Mother Temple of Besakih.jpg", "Besakih Bali Indonesia Pura-Besakih-02.jpg"],
  ulunDanu: ["Pura Ulun Danu Beratan in bali.jpg", "Pura Ulun Danu Beratan.jpg"],
  riceTerrace: ["Tegallalang rice terraces SF0001.jpg", "Rice terraces, Bali.jpg"],
  monkeyForest: ["Bali – The Sacred Monkey Forest Sanctuary (2688747778).jpg", "Sacred Monkey Forest Sanctuary (49818583963).jpg"],
  dancer: ["Ubud, Balinese dance, Dancer, Bali, Indonesia.jpg", "'Legong', Ubud, Balinese dance, Bali, Indonesia.jpg"],
  sasak: ["Tenun Ikat Lombok Traditional Sasak Village Sade.JPG", "Traditional Sasak Village Sade houses.JPG"],
  penanjakan: ["Bromo Semeru View - Sunrise Moment at Penanjakan.jpg", "Mount Penanjakan (Bromo-Tengger-Semeru) at sunrise 2.jpg"],
  phinisi: ["Phinisi, Penjelajah Pulau di Labuan Bajo.jpg", "Penginapan Sekaligus Transportasi di Labuan Bajo.jpg"],
  snorkel: ["The Art Of The Coral Garden (219415741).jpeg", "Pink Coral - Flickr - Christian Gloor.jpg"],
  beach: ["Beachfront of Paradisus by Meliá Bali in Nusa Dua.jpg", "Wonderfull Nusa Penida.jpg"],
  borobudurStupas: ["Borobudur-Temple-Park Indonesia Stupas-of-Borobudur-04.jpg", "Borobudur Indonesia 2.jpg"],
  prambanan: ["Yogyakarta Indonesia Prambanan-temple-complex-24.jpg", "Prambanan temple, Central Java, Indonesia, 20220818 1311 9139.jpg"],
  waterfall: ["Tumpak sewu waterfall.jpg", "CobanSewu Waterfall.jpg"],
};

const pool = [];
for (const f of ["imgs1", "imgs2", "imgs3", "imgs4"]) {
  try {
    pool.push(...JSON.parse(fs.readFileSync(`./${f}.json`, "utf8")));
  } catch {}
}
const byTitle = new Map(pool.map((x) => [x.title, x.url]));

const lines = ["/* Auto-curated Wikimedia Commons imagery (freely licensed). See tools/harvest-images.mjs */", ""];
const missing = [];
for (const [key, titles] of Object.entries(picks)) {
  const url = titles.map((t) => byTitle.get(t)).find(Boolean);
  if (!url) missing.push(key);
  lines.push(`export const ${key} = ${JSON.stringify(url ?? "")};`);
}
if (missing.length) console.error("MISSING:", missing.join(", "));
fs.writeFileSync("src/data/images.ts", lines.join("\n") + "\n");
console.log("wrote src/data/images.ts with", Object.keys(picks).length - missing.length, "images");

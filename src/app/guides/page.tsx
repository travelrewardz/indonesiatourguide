import { GUIDES, LANGUAGES } from "@/data/catalog";

export const metadata = { title: "Our Guides" };

export default function GuidesPage() {
  return (
    <div className="py-12">
      <div className="container-x">
        <h1 className="text-4xl font-black tracking-tight">
          Guides in your language
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Every guide is licensed by the Indonesian Ministry of Tourism and
          speaks your clients&apos; language natively. Here is a sample of the
          team — tell us the language and region and we will match your group.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <div key={g.id} className="card p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-black text-brand-700">
                  {g.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="font-bold">{g.name}</div>
                  <div className="text-sm text-gray-500">{g.basedIn}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-black text-brand-700">
                    {g.rating}
                  </div>
                  <div className="text-[11px] text-gray-500">rating</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Specialty:</span>{" "}
                {g.specialty}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {g.languages.map((l) => (
                  <span key={l} className="badge bg-sand-100 text-brand-800">
                    {LANGUAGES[l]}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-xs text-gray-500">
                {g.yearsExperience} years experience · Licensed guide
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-brand-900 p-10 text-center text-white">
          <h2 className="text-2xl font-bold">Need a specific language?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sand-200">
            We coordinate guides in 10 languages across every major region —
            including niche requests like Italian-speaking wildlife naturalists
            or Japanese-speaking dive masters.
          </p>
          <a href="/contact" className="btn-white mt-6">
            Request a language match
          </a>
        </div>
      </div>
    </div>
  );
}

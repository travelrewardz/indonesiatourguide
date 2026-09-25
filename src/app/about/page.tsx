import Link from "next/link";
import { LANGUAGES, WHY_US } from "@/data/catalog";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="container-x max-w-4xl">
        <h1 className="text-4xl font-black tracking-tight">
          About Indonesia Tour Guide
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-700">
          We are a licensed destination management company headquartered in
          Bali, operating across the entire Indonesian archipelago since 2009.
          Our promise is simple: authentic journeys, narrated in your language,
          delivered by the people who call these islands home.
        </p>
        <p className="mt-4 leading-7 text-gray-600">
          From the sacred temples of Bali to the dragon islands of Komodo, the
          orangutan forests of Sumatra and Borneo, and the coral kingdoms of
          Raja Ampat, our teams design and operate private itineraries for
          travellers, families, honeymoons, incentives and travel agencies
          worldwide.
        </p>

        <h2 className="mt-12 text-2xl font-bold">How we work</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {WHY_US.map((w) => (
            <div key={w.title} className="card p-6">
              <h3 className="font-bold text-brand-700">{w.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{w.text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-bold">Guiding languages</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.values(LANGUAGES).map((l) => (
            <span key={l} className="badge bg-sand-100 px-3 py-1.5 text-sm text-brand-800">
              {l}
            </span>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-sand-50 p-8 text-center">
          <h3 className="text-xl font-bold">Working with agencies</h3>
          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            We power tour operators and travel agencies with net rates, a
            partner portal, fast quotes and 24/7 operational support.
          </p>
          <Link href="/partners" className="btn-primary mt-5">
            Explore the B2B program
          </Link>
        </div>
      </div>
    </div>
  );
}

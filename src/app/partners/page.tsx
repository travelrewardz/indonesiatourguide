import Link from "next/link";
import { RATE_TIERS, TOURS, LANGUAGES } from "@/data/catalog";
import { formatUSD } from "@/lib/format";

export const metadata = {
  title: "For Travel Agencies — Net Rates & Partner Portal",
  description:
    "Register as a trade partner for net rates up to 25% off brochure prices, fast quotes and a B2B portal for bookings.",
};

export default function PartnersPage() {
  const example = TOURS.find((t) => t.slug === "komodo-phinisi-sailing-4-days")!;
  const net = (pct: number) =>
    Math.round(example.retailPricePerPerson * (1 - pct / 100));

  return (
    <div>
      {/* HERO */}
      <section className="bg-brand-900 py-20 text-white">
        <div className="container-x max-w-4xl text-center">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
            B2B · Destination Management
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
            Grow your agency with Indonesia net rates up to 25% off
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-sand-200">
            Join 140+ agencies worldwide selling our private Indonesia journeys.
            Get a trade account, quote in minutes from the partner portal, and
            let our ops team handle guides, transport, permits and 24/7 support
            on the ground.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/partners/register" className="btn-white text-base">
              Create trade account
            </Link>
            <Link
              href="/partners/login"
              className="btn border border-white/60 text-white hover:bg-white/10"
            >
              Partner login
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="container-x">
          <h2 className="text-center text-3xl font-black tracking-tight">
            How the partnership works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              ["1", "Register", "Tell us about your agency. Trade accounts are reviewed and approved within one business day."],
              ["2", "Browse net rates", "See tiered net pricing on every tour the moment you log in — no waiting for price lists."],
              ["3", "Quote & book", "Build quotes for your client's dates, language and group size, then confirm with one click."],
              ["4", "We operate", "Licensed guides, private transport, permits and a WhatsApp duty line on every departure."],
            ].map(([n, t, d]) => (
              <div key={n} className="relative">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-lg font-black text-white">
                  {n}
                </div>
                <h3 className="mt-4 font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NET RATE TIERS */}
      <section id="rates" className="bg-sand-50 py-20">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black tracking-tight">
              Tiered net-rate program
            </h2>
            <p className="mt-3 text-gray-600">
              Your tier is based on confirmed bookings per calendar year — and
              example below uses our{" "}
              <Link href={`/tours/${example.slug}`} className="font-semibold text-brand-600 hover:underline">
                {example.title}
              </Link>{" "}
              ({formatUSD(example.retailPricePerPerson)} retail pp).
            </p>
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white text-left text-sm shadow-sm">
              <thead>
                <tr className="bg-brand-700 text-white">
                  <th className="px-5 py-3.5 font-semibold">Tier</th>
                  <th className="px-5 py-3.5 font-semibold">Discount</th>
                  <th className="px-5 py-3.5 font-semibold">
                    Bookings / year
                  </th>
                  <th className="px-5 py-3.5 font-semibold">
                    Net rate pp (example)
                  </th>
                </tr>
              </thead>
              <tbody>
                {RATE_TIERS.map((tier) => (
                  <tr key={tier.id} className="border-t border-gray-100">
                    <td className="px-5 py-4">
                      <div className="font-bold text-brand-800">{tier.name}</div>
                      <div className="text-xs text-gray-500">{tier.description}</div>
                    </td>
                    <td className="px-5 py-4 font-bold">{tier.discountPct}% off</td>
                    <td className="px-5 py-4">
                      {tier.minBookingsYtd === 0 ? "—" : `${tier.minBookingsYtd}+`}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-sand-100 px-2 py-1 font-bold text-brand-800">
                        {formatUSD(net(tier.discountPct))} pp
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-gray-500">
            Net rates are per person on twin-share, ex-beta — full conditions in
            the partner portal after approval. Your tier updates automatically
            as your bookings grow.
          </p>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              What partners get
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                "Net rates up to 25% off brochure pricing, visible instantly in the portal",
                "Quote builder — pick tour, dates, pax and language; pricing calculated for you",
                "Priority guide allocation in 10 languages, confirmed at booking",
                "White-label documents on request (vouchers, itineraries, invoices)",
                "Dedicated account manager from Silver tier upward",
                "24/7 duty phone and WhatsApp operational support in-country",
              ].map((b) => (
                <li key={b} className="flex gap-3 text-gray-700">
                  <span className="mt-0.5 text-brand-600">✓</span>
                  <span className="text-sm leading-6">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-8">
            <h3 className="text-xl font-bold">Already have an account?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Log in to build quotes, track bookings and download invoices.
            </p>
            <Link href="/partners/login" className="btn-primary mt-5 w-full">
              Partner login
            </Link>
            <div className="mt-6 border-t border-gray-100 pt-5 text-sm text-gray-600">
              <div className="font-semibold text-gray-800">
                Languages your clients can book in:
              </div>
              <p className="mt-2 leading-6">
                {Object.values(LANGUAGES).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

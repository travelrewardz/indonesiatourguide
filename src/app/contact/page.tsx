import type { Metadata } from "next";
import Link from "next/link";
import EnquiryForm from "@/components/EnquiryForm";
import { setting } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const p = await searchParams;
  const raw = typeof p.type === "string" ? p.type : "";
  const title = raw === "tailor_made" ? "Plan My Trip — Tailor-made Indonesia itinerary" : raw === "quote" ? "Request a custom quote" : "Contact Indonesia Tour Guide";
  return buildMetadata({
    title,
    description: "Contact our Denpasar operations team — itinerary requests, booking support and B2B enquiries answered within 24 hours.",
    path: "/contact",
  });
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await searchParams;
  const typeParam = typeof p.type === "string" ? p.type : "";
  const type = typeParam === "tailor_made" || typeParam === "quote" ? typeParam : "contact";

  const email = setting("contact_email");
  const phone = setting("contact_phone");
  const address = setting("address");
  const wa = whatsappLink("Hello Indonesia Tour Guide, I have a question about a tour.");

  return (
    <div className="bg-gray-50">
      <div className="bg-ink py-12 text-white">
        <div className="container-x">
          <div className="text-sm text-white/60"><Link href="/" className="hover:text-accent">Home</Link> / Contact</div>
          <h1 className="font-display mt-2 text-4xl font-medium">
            {type === "tailor_made" ? "Plan My Trip" : type === "quote" ? "Request a custom quote" : "Talk to a real human"}
          </h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Our operations team in Denpasar answers within 24 hours (Mon–Sat, WITA) — in English, Bahasa Indonesia
            and 10 more languages.
          </p>
        </div>
      </div>

      <div className="container-x grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <div>
          <EnquiryForm
            type={type === "contact" ? "contact" : type === "quote" ? "quote" : "tailor_made"}
            defaults={{
              destination: typeof p.destination === "string" ? p.destination.replace(/-/g, " ") : "",
              travel_date: typeof p.date === "string" ? p.date : "",
              pax: typeof p.pax === "string" ? p.pax : "",
            }}
            submitLabel={type === "contact" ? "Send message" : "Send request"}
          />
        </div>

        <aside className="space-y-5">
          <div className="card p-6">
            <h2 className="font-bold">Contact details</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="flex gap-3"><span>📧</span><a className="hover:text-brand-600" href={`mailto:${email}`}>{email}</a></li>
              <li className="flex gap-3"><span>📞</span><a className="hover:text-brand-600" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>
              <li className="flex gap-3"><span>🏢</span><span>{address}</span></li>
              <li className="flex gap-3"><span>🕘</span><span>Mon–Sat, 08:00–18:00 WITA</span></li>
            </ul>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full border-green-600 bg-green-600 hover:bg-green-700">
              💬 Chat on WhatsApp
            </a>
          </div>

          <div className="card p-6">
            <h2 className="font-bold">Booking support</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Already booked? Sign in to see your voucher, change your date, or message your guide.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/login" className="btn-outline btn-sm">Sign in</Link>
              <Link href="/faq" className="btn-ghost btn-sm">FAQ →</Link>
            </div>
          </div>

          <div className="card p-6 text-sm text-gray-600">
            <h2 className="font-bold text-ink">Agencies & operators</h2>
            <p className="mt-2">Sell Indonesia with net rates and instant quotes.</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/agents" className="btn-outline btn-sm">Travel agency portal</Link>
              <Link href="/register?role=supplier" className="btn-ghost btn-sm">Apply as a supplier →</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

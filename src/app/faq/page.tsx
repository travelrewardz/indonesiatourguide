import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { buildMetadata, breadcrumbLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "FAQ — Booking, Payment, Cancellation & Safety",
  description: "Answers about booking Indonesia tours: confirmation, payments, cancellations, availability, groups, safety and supplier standards.",
  path: "/faq",
});

const FAQS: { q: string; a: string }[] = [
  { q: "How do I know my booking is real?", a: "Every checkout writes a booking row to our database with a unique number (ITG-YYYYMMDD-#####) and immediately emails you a receipt. The operations team confirms availability within a few hours and your voucher appears in your dashboard." },
  { q: "Which payment methods do you accept?", a: "We use Indonesian and international gateways — Midtrans (bank transfer, QRIS, GoPay, OVO, credit/debit cards) with PayPal and Stripe available by configuration. Card details are tokenized by the provider; our servers never store card data." },
  { q: "Can I pay later instead of online?", a: "Yes — choose 'Bank transfer' at checkout. Your date is held while you transfer, and an admin marks the payment received once it lands." },
  { q: "What is your cancellation policy?", a: "Free date changes up to 48 hours before departure. Cancellations more than 72 hours before departure are fully refunded; inside 72 hours is non-refundable unless your operator cancels." },
  { q: "How does availability work?", a: "Each tour and option has a capacity. Every booking atomically reserves slots — when the calendar says 4 spots remain, exactly 4 are left. Sold-out dates can't be booked." },
  { q: "Are prices final?", a: "The server computes your total from the tour, option, date and traveller count before payment — the number you see at checkout is the number charged, in USD." },
  { q: "Can you handle large groups?", a: "Yes. Anything above the published maximum pax becomes a group enquiry — use 'Request Custom Quote' on any tour page." },
  { q: "Will I have a real guide?", a: "All tours are operated by licensed local suppliers we verify personally. Guides are locals, vehicles are insured, and our Denpasar team stays reachable on WhatsApp throughout." },
  { q: "What about travel insurance?", a: "We strongly recommend it, especially for trekking, diving and volcano tours. It isn't included in tour prices." },
  { q: "Do you support travel agencies?", a: "Yes — agencies get net rates, instant quotes, commission tracking and vouchers through the B2B portal. Register under 'Travel agency' at signup." },
];

export default function FaqPage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-ink py-12 text-white">
        <div className="container-x">
          <div className="text-sm text-white/60"><Link href="/" className="hover:text-accent">Home</Link> / FAQ</div>
          <h1 className="font-display mt-2 text-4xl font-medium">Frequently asked questions</h1>
        </div>
      </div>

      <div className="container-x max-w-3xl py-12">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={f.q} className="rounded-2xl border border-gray-200 bg-white p-5" open={i === 0}>
              <summary className="cursor-pointer font-semibold marker:hidden">
                <span className="float-right text-brand-600 transition-transform group-open:rotate-45">＋</span>
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-7 text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-brand-700 p-8 text-center text-white">
          <h2 className="font-display text-2xl font-medium">Still have a question?</h2>
          <p className="mt-2 text-white/80">We answer within 24 hours — or instantly on WhatsApp.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/contact" className="btn-accent">Contact us</Link>
            <Link href="/tours" className="btn-white">Browse tours</Link>
          </div>
        </div>
      </div>

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }])} />
    </div>
  );
}

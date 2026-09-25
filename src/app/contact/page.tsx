import ContactForm from "@/components/ContactForm";
import { findTour } from "@/data/catalog";

export const metadata = { title: "Contact" };

type Search = { tour?: string };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const tour = sp.tour ? findTour(sp.tour) : undefined;

  return (
    <div className="py-12">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_480px]">
        <div>
          <h1 className="text-4xl font-black tracking-tight">
            {tour ? `Request a quote — ${tour.title}` : "Let's plan your Indonesia"}
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-gray-700">
            Tell us what you are dreaming of and one of our destination
            specialists will reply within one business day with availability,
            pricing and honest advice.
          </p>

          <dl className="mt-10 space-y-6">
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                Email
              </dt>
              <dd className="mt-1 text-gray-800">hello@indonesiatourguide.com</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                Phone / WhatsApp
              </dt>
              <dd className="mt-1 text-gray-800">+62 361 555 0198</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                Office
              </dt>
              <dd className="mt-1 text-gray-800">
                Jalan Raya Ubud No. 88, Bali 80571, Indonesia
                <br />
                Mon–Sat, 09:00–18:00 (UTC+8)
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                Travel trade
              </dt>
              <dd className="mt-1 text-gray-800">
                Agencies can register for net rates via the{" "}
                <a href="/partners" className="font-semibold text-brand-600 hover:underline">
                  partner program
                </a>
                .
              </dd>
            </div>
          </dl>
        </div>

        <ContactForm
          formAction="/api/enquiries"
          title={tour ? "Quote request" : "Trip enquiry"}
          subtitle="We reply within one business day."
          submitLabel="Send enquiry"
          defaultTour={tour?.slug}
        />
      </div>
    </div>
  );
}

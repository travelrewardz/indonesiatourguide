import Link from "next/link";
import Image from "next/image";
import { LANGUAGES } from "@/data/catalog";

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-brand-900 text-sand-100">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-itg.png"
              alt="Indonesia Tour Guide logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg bg-white object-contain p-0.5"
            />
            <span className="text-lg font-bold">Indonesia Tour Guide</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-sand-200">
            Authentic Indonesia tours, narrated in your language. Licensed
            destination management company covering the whole archipelago.
          </p>
          <p className="mt-4 text-xs text-sand-200">
            Jalan Raya Ubud No. 88, Bali 80571, Indonesia
            <br />
            +62 361 555 0198 · hello@indonesiatourguide.com
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
            Explore
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/tours">All tours</Link></li>
            <li><Link className="hover:text-white" href="/destinations">Destinations</Link></li>
            <li><Link className="hover:text-white" href="/guides">Our guides</Link></li>
            <li><Link className="hover:text-white" href="/about">About us</Link></li>
            <li><Link className="hover:text-white" href="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
            For Travel Trade
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/partners">Partnerships &amp; net rates</Link></li>
            <li><Link className="hover:text-white" href="/partners/register">Become a partner</Link></li>
            <li><Link className="hover:text-white" href="/partners/login">Partner portal</Link></li>
            <li><Link className="hover:text-white" href="/partners#rates">Net-rate tiers</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
            Guiding languages
          </h4>
          <p className="mt-4 text-sm leading-6 text-sand-200">
            {Object.values(LANGUAGES).join(" · ")}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-sand-200 sm:flex-row">
          <span>© {new Date().getFullYear()} Indonesia Tour Guide. All rights reserved.</span>
          <span>Connecting Partners · Creating Journeys · Sharing Indonesia</span>
        </div>
      </div>
    </footer>
  );
}

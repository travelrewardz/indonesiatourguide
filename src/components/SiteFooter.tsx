import Link from "next/link";
import { publishedDestinations, setting } from "@/lib/queries";

/** Database-driven footer: contact details from settings, links from CMS. */
export default async function SiteFooter() {
  const destinations = publishedDestinations(true).slice(0, 8);
  const email = setting("contact_email", "operations@indonesiatourguide.com");
  const phone = setting("contact_phone", "+62 812 3456 7890");
  const address = setting("address");
  const license = setting("license");

  return (
    <footer className="border-t border-gray-200 bg-ink text-gray-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-lg font-bold text-white">
            Indonesia <span className="text-accent">Tour Guide</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Licensed Indonesian destination management company connecting travellers with verified local
            operators across the archipelago — from Bali to Raja Ampat.
          </p>
          <p className="mt-4 text-xs leading-5 text-gray-500">{license}</p>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider text-white">Explore</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/tours" className="hover:text-accent">All tours</Link></li>
            <li><Link href="/destinations" className="hover:text-accent">Destinations</Link></li>
            <li><Link href="/blog" className="hover:text-accent">Travel blog</Link></li>
            <li><Link href="/about" className="hover:text-accent">About us</Link></li>
            <li><Link href="/contact" className="hover:text-accent">Contact</Link></li>
            <li><Link href="/faq" className="hover:text-accent">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider text-white">Popular destinations</div>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {destinations.map((d) => (
              <li key={d.slug}>
                <Link href={`/destinations/${d.slug}`} className="hover:text-accent">{d.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wider text-white">Partner with us</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/agents" className="hover:text-accent">Travel agencies (B2B net rates)</Link></li>
            <li><Link href="/register?role=supplier" className="hover:text-accent">Become a supplier</Link></li>
            <li><Link href="/account" className="hover:text-accent">Customer dashboard</Link></li>
          </ul>
          <div className="mt-5 space-y-1.5 text-sm">
            <a href={`mailto:${email}`} className="block hover:text-accent">{email}</a>
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="block hover:text-accent">{phone}</a>
            <p className="text-xs text-gray-500">{address}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Indonesia Tour Guide. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-300">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
            <Link href="/contact" className="hover:text-gray-300">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

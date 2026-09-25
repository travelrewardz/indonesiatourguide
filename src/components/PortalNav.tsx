"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/format";

const LINKS = [
  { href: "/partners/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/partners/quotes", label: "Quotes (RFQ)", icon: "✎" },
  { href: "/partners/quotes/new", label: "New quote", icon: "＋" },
  { href: "/partners/bookings", label: "Bookings", icon: "✓" },
  { href: "/partners/profile", label: "Company profile", icon: "◐" },
];

export default function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="card mt-4 p-2">
      {LINKS.map((l) => {
        const active =
          l.href === "/partners/quotes/new"
            ? pathname === l.href
            : pathname === l.href ||
              (l.href !== "/partners/dashboard" &&
                pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cx(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <span className="w-4 text-center text-brand-600">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

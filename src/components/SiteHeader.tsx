"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cx } from "@/lib/format";
import { RATE_TIERS } from "@/data/catalog";

type PartnerBadge = { companyName: string; tier: string } | null;

const NAV = [
  { href: "/", label: "Home" },
  { href: "/tours", label: "Tours" },
  { href: "/destinations", label: "Destinations" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader({ partner }: { partner: PartnerBadge }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const tierName =
    RATE_TIERS.find((t) => t.id === partner?.tier)?.name ?? "Standard";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-itg.png"
            alt="Indonesia Tour Guide logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="text-lg font-bold tracking-tight">
            Indonesia <span className="text-brand-600">Tour Guide</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {partner ? (
            <Link href="/partners/dashboard" className="btn-outline btn-sm">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {partner.companyName.slice(0, 1).toUpperCase()}
              </span>
              Portal · {tierName}
            </Link>
          ) : (
            <>
              <Link href="/partners" className="btn-outline btn-sm">
                For Agencies
              </Link>
              <Link href="/partners/login" className="btn-primary btn-sm">
                Partner Login
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <nav className="container-x flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-gray-100 pt-3">
              {partner ? (
                <Link
                  href="/partners/dashboard"
                  onClick={() => setOpen(false)}
                  className="btn-primary btn-sm flex-1"
                >
                  Partner Portal
                </Link>
              ) : (
                <>
                  <Link
                    href="/partners"
                    onClick={() => setOpen(false)}
                    className="btn-outline btn-sm flex-1"
                  >
                    For Agencies
                  </Link>
                  <Link
                    href="/partners/login"
                    onClick={() => setOpen(false)}
                    className="btn-primary btn-sm flex-1"
                  >
                    Partner Login
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

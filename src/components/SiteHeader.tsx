"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";

export type HeaderUser = { name: string; email: string; role: string } | null;

const NAV = [
  { href: "/tours", label: "nav.tours" },
  { href: "/destinations", label: "nav.destinations" },
  { href: "/blog", label: "nav.blog" },
  { href: "/agents", label: "nav.forAgencies" },
  { href: "/contact", label: "nav.contact" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "SGD", "IDR"];
const LOCALES: [string, string][] = [
  ["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"],
  ["it", "Italiano"], ["nl", "Nederlands"], ["id", "Bahasa Indonesia"],
];

function homeFor(role: string): string {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  if (role === "SUPPLIER") return "/supplier";
  if (role === "TRAVEL_AGENT") return "/agents";
  return "/account";
}

type Notif = { id: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

export default function SiteHeader({
  user, locale, currency, unread, t: dict,
}: {
  user: HeaderUser;
  locale: string;
  currency: string;
  unread: number;
  t: Record<string, string>; // pre-resolved translation dictionary (plain object)
}) {
  const t = (key: string) => dict[key] ?? key;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadState, setUnreadState] = useState(unread);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) setNotifs(d.items);
        if (typeof d?.unread === "number") setUnreadState(d.unread);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setBellOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function setPref(name: string, value: string) {
    document.cookie = `${name}=${value};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      {/* top utility strip */}
      <div className="hidden bg-ink text-white md:block">
        <div className="container-x flex h-8 items-center justify-between text-[12px]">
          <div className="flex items-center gap-4 text-white/80">
            <span>🌿 Licensed Indonesian operator</span>
            <span>💬 Support in 10 languages</span>
            <span>⚡ Free date changes up to 48h</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="cur">Currency</label>
            <select
              id="cur"
              value={currency}
              onChange={(e) => setPref("itg_currency", e.target.value)}
              className="rounded bg-transparent text-white/90 focus:outline-none focus:ring-1 focus:ring-white/40"
            >
              {CURRENCIES.map((c) => <option key={c} value={c} className="text-black">{c}</option>)}
            </select>
            <label className="sr-only" htmlFor="loc">Language</label>
            <select
              id="loc"
              value={locale}
              onChange={(e) => setPref("itg_locale", e.target.value)}
              className="rounded bg-transparent text-white/90 focus:outline-none focus:ring-1 focus:ring-white/40"
            >
              {LOCALES.map(([code, name]) => <option key={code} value={code} className="text-black">{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 font-display text-lg font-bold text-white">🇮🇩</span>
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
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex" ref={menuRef}>
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setBellOpen((v) => !v)}
                className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label={t("nav.dashboard")}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unreadState > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {unreadState > 9 ? "9+" : unreadState}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-4 top-24 z-50 w-80 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  <div className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Notifications
                    <button
                      type="button"
                      className="text-brand-600 normal-case"
                      onClick={async () => {
                        await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
                        setUnreadState(0);
                        setNotifs((n) => n.map((x) => ({ ...x, read_at: x.read_at ?? "now" })));
                      }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 && <p className="px-2 py-4 text-sm text-gray-500">No notifications yet.</p>}
                    {notifs.slice(0, 10).map((n) => (
                      <Link
                        key={n.id}
                        href={n.link ?? "#"}
                        onClick={() => setBellOpen(false)}
                        className={cx("block rounded-lg px-2 py-2 text-sm hover:bg-gray-50", !n.read_at && "bg-brand-50/60")}
                      >
                        <div className="font-medium text-ink">{n.title}</div>
                        {n.body && <div className="line-clamp-2 text-xs text-gray-500">{n.body}</div>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="max-w-24 truncate">{user.name.split(" ")[0]}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
                    <Link href={homeFor(user.role)} onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      {t("nav.dashboard")}
                    </Link>
                    <Link href="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      {t("nav.account")}
                    </Link>
                    <Link href="/account/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">
                      Profile
                    </Link>
                    <hr className="my-1" />
                    <button type="button" onClick={signOut} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      {t("nav.signOut")}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm">{t("nav.signIn")}</Link>
              <Link href="/register" className="btn-primary btn-sm">{t("nav.signUp")}</Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <nav className="container-x flex flex-col py-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                {t(item.label)}
              </Link>
            ))}
            <hr className="my-2" />
            {user ? (
              <>
                <Link href={homeFor(user.role)} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  {t("nav.dashboard")}
                </Link>
                <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  {t("nav.account")}
                </Link>
                <button type="button" onClick={signOut} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                  {t("nav.signOut")}
                </button>
              </>
            ) : (
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-outline btn-sm flex-1">{t("nav.signIn")}</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary btn-sm flex-1">{t("nav.signUp")}</Link>
              </div>
            )}
            <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
              <select value={currency} onChange={(e) => setPref("itg_currency", e.target.value)} className="input py-1.5 text-xs">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={locale} onChange={(e) => setPref("itg_locale", e.target.value)} className="input py-1.5 text-xs">
                {LOCALES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

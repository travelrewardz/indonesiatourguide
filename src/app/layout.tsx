import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import Analytics from "@/components/Analytics";
import { getSessionUser } from "@/lib/auth";
import { getLocale, getDisplayCurrency } from "@/lib/prefs";
import { t, LOCALE_NAMES, dictionary, type Locale } from "@/lib/i18n";
import { organizationLd, localBusinessLd, buildMetadata } from "@/lib/seo";
import { unreadCount } from "@/lib/notify";
import { flushEmailQueue } from "@/lib/email";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  ...buildMetadata({ path: "/" }),
  title: {
    default: "Indonesia Tour Guide — Discover Indonesia With Local Experts",
    template: "%s — Indonesia Tour Guide",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, locale, currency] = await Promise.all([getSessionUser(), getLocale(), getDisplayCurrency()]);
  const dict = dictionary(locale);

  // Opportunistically flush the transactional email queue (no-op without SMTP).
  void flushEmailQueue();

  return (
    <html lang={locale} className={playfair.variable}>
      <body className="font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
        <SiteHeader
          user={user ? { name: user.name, email: user.email, role: user.role } : null}
          locale={locale as Locale}
          currency={currency}
          unread={user ? unreadCount(user.id) : 0}
          t={dict}
        />
        <main id="main" className="min-h-[60vh]">{children}</main>
        <SiteFooter />
        <Suspense><Analytics /></Suspense>
        <JsonLd data={organizationLd()} />
        <JsonLd data={localBusinessLd()} />
        <span className="hidden" data-locale-name={LOCALE_NAMES[locale]} />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`}
          </Script>
        )}
      </body>
    </html>
  );
}

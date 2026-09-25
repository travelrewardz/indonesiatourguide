import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSessionPartner } from "@/lib/session";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Indonesia Tour Guide — Authentic Indonesia tours in your language",
    template: "%s — Indonesia Tour Guide",
  },
  description:
    "Authentic Indonesia tours, narrated in your language. Multi-language local guides — Bahasa, English, Spanish, Italian, German, Dutch, French, Mandarin, Japanese & Russian — covering Bali, Java, Komodo, Sumatra and beyond. B2B net rates for travel agencies.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const partner = await getSessionPartner();
  return (
    <html lang="en" className={playfair.variable}>
      <body className="font-sans">
        <SiteHeader
          partner={
            partner
              ? { companyName: partner.companyName, tier: partner.tier }
              : null
          }
        />
        <main className="min-h-screen">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

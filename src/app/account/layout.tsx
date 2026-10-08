import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(undefined, "/account");

  return (
    <div className="bg-gray-50">
      <div className="bg-ink py-8 text-white">
        <div className="container-x">
          <div className="text-sm text-white/60"><Link href="/" className="hover:text-accent">Home</Link> / Account</div>
          <h1 className="font-display mt-1 text-3xl font-medium">Hello, {user.name.split(" ")[0]}</h1>
        </div>
      </div>
      <div className="container-x py-8">
        <nav className="mb-6 flex flex-wrap gap-2">
          {[
            { href: "/account", label: "Overview" },
            { href: "/account/bookings", label: "My bookings" },
            { href: "/account/profile", label: "Profile" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:border-brand-400 hover:text-brand-600">
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}

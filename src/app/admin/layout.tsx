import Link from "next/link";
import { requireUser } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/tours", label: "Tours" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/cms", label: "CMS" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["ADMIN", "SUPER_ADMIN"], "/login");

  return (
    <div className="bg-gray-100">
      <div className="border-b border-gray-200 bg-white">
        <div className="container-x flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm text-white">⚙</span>
            Admin Console
            <span className="badge bg-brand-100 text-brand-700">{user.role}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-gray-500 hover:text-brand-600">View site ↗</Link>
            <span className="hidden text-gray-400 sm:inline">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-6 py-6 lg:grid-cols-[210px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="flex flex-wrap gap-1.5 lg:flex-col">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-ink hover:shadow-sm">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

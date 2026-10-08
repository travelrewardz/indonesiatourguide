import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["SUPPLIER", "ADMIN", "SUPER_ADMIN"], "/login");
  const supplier = get<{ company_name: string; verification_status: string }>(
    "SELECT company_name, verification_status FROM suppliers WHERE user_id = ?", user.id,
  );

  return (
    <div className="bg-gray-50">
      <div className="bg-ink py-8 text-white">
        <div className="container-x">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-white/60"><Link href="/" className="hover:text-accent">Home</Link> / Supplier</div>
              <h1 className="font-display mt-1 text-3xl font-medium">{supplier?.company_name ?? "Supplier dashboard"}</h1>
            </div>
            <span className={`badge ${supplier?.verification_status === "APPROVED" ? "bg-brand-500 text-white" : "bg-amber-500 text-white"}`}>
              {supplier?.verification_status ?? "PENDING"}
            </span>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {[
              { href: "/supplier", label: "Overview" },
              { href: "/supplier/tours", label: "My tours" },
              { href: "/supplier/bookings", label: "Bookings" },
              { href: "/supplier/availability", label: "Availability" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="container-x py-8">{children}</div>
    </div>
  );
}

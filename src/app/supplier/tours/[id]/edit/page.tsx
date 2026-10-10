import TourEditor from "@/components/tour/TourEditor";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditSupplierTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const tour = get<{ id: string; supplier_id: string | null }>("SELECT id, supplier_id FROM tours WHERE id = ?", id);
  if (!tour) notFound();
  if (!isAdmin) {
    const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", user.id);
    if (!supplier || tour.supplier_id !== supplier.id) notFound();
  }
  const destinations = all<{ slug: string; name: string; region: string | null }>(
    "SELECT slug, name, region FROM destinations ORDER BY sort_order",
  );
  const suppliers = isAdmin
    ? all<{ id: string; company_name: string }>("SELECT id, company_name FROM suppliers ORDER BY company_name")
    : undefined;

  return (
    <div>
      <h2 className="font-display mb-4 text-xl font-medium">Edit tour</h2>
      <TourEditor tourId={id} destinations={destinations} suppliers={suppliers} redirectBase="/supplier" />
    </div>
  );
}

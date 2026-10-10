import TourEditor from "@/components/tour/TourEditor";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewSupplierTourPage() {
  const user = (await getSessionUser())!;
  const supplier = get<{ id: string; preferred_currency: string }>(
    "SELECT id, preferred_currency FROM suppliers WHERE user_id = ?", user.id,
  );
  if (!supplier && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") redirect("/supplier");
  const destinations = all<{ slug: string; name: string; region: string | null }>(
    "SELECT slug, name, region FROM destinations ORDER BY sort_order",
  );

  return (
    <div>
      <h2 className="font-display mb-4 text-xl font-medium">Create a new tour</h2>
      <TourEditor
        destinations={destinations}
        redirectBase="/supplier"
        defaultCurrency={supplier?.preferred_currency || "USD"}
      />
    </div>
  );
}

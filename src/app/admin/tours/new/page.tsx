import TourEditor from "@/components/tour/TourEditor";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminNewTourPage() {
  const destinations = all<{ slug: string; name: string }>("SELECT slug, name FROM destinations ORDER BY sort_order");
  const suppliers = all<{ id: string; company_name: string }>("SELECT id, company_name FROM suppliers ORDER BY company_name");

  return (
    <div>
      <h1 className="text-xl font-bold">Create tour</h1>
      <div className="mt-4">
        <TourEditor destinations={destinations} suppliers={suppliers} redirectBase="/admin" />
      </div>
    </div>
  );
}

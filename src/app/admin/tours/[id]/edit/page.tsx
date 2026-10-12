import TourEditor from "@/components/tour/TourEditor";
import { all } from "@/lib/db";
import { notFound } from "next/navigation";
import { destinationsWithRegions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminEditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await fetchTour(id);
  if (!tour) notFound();
  const destinations = destinationsWithRegions();
  const suppliers = all<{ id: string; company_name: string }>("SELECT id, company_name FROM suppliers ORDER BY company_name");

  return (
    <div>
      <h1 className="text-xl font-bold">Edit tour</h1>
      <div className="mt-4">
        <TourEditor tourId={id} destinations={destinations} suppliers={suppliers} redirectBase="/admin" />
      </div>
    </div>
  );
}

async function fetchTour(id: string): Promise<boolean> {
  const { get } = await import("@/lib/db");
  return !!get("SELECT id FROM tours WHERE id = ?", id);
}

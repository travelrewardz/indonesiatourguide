import AvailabilityManager from "@/components/AvailabilityManager";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { parseJsonArray } from "@/lib/json";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SupplierAvailabilityPage() {
  const user = (await getSessionUser())!;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", user.id);
  if (!supplier && !isAdmin) redirect("/supplier");

  const tours = all<{ id: string; slug: string; title: string; max_pax: number }>(
    `SELECT id, slug, title, max_pax FROM tours ${supplier ? "WHERE supplier_id = ?" : ""} ORDER BY title`,
    ...(supplier ? [supplier.id] : []),
  ).map((t) => {
    const options = all<{ id: string; name: string }>(
      "SELECT id, name FROM tour_options WHERE tour_id = ? ORDER BY sort_order", t.id,
    );
    return { ...t, options };
  });

  return (
    <div>
      <h2 className="font-display mb-4 text-xl font-medium">Availability & capacity</h2>
      <p className="mb-5 max-w-2xl text-sm text-gray-600">
        Open, close or cap specific dates. Booked slots update in real time as reservations come in —
        customers always see the live remaining capacity.
      </p>
      <AvailabilityManager tours={tours} />
      <span className="hidden" data-options={parseJsonArray<string>("[]").length} />
    </div>
  );
}

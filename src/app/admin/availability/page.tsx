import AvailabilityManager from "@/components/AvailabilityManager";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AdminAvailabilityPage() {
  const tours = all<{ id: string; slug: string; title: string; max_pax: number }>(
    "SELECT id, slug, title, max_pax FROM tours ORDER BY title",
  ).map((t) => ({
    ...t,
    options: all<{ id: string; name: string }>(
      "SELECT id, name FROM tour_options WHERE tour_id = ? ORDER BY sort_order", t.id,
    ),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold">Availability & capacity</h1>
      <p className="mt-1 mb-5 max-w-2xl text-sm text-gray-600">
        Open or close dates, cap capacity per tour or option, and watch bookings reserve slots in real time.
      </p>
      <AvailabilityManager tours={tours} />
    </div>
  );
}

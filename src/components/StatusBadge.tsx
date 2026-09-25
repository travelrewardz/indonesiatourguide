import { cx } from "@/lib/format";
import type { QuoteStatus, BookingStatus } from "@/lib/types";

const QUOTE_STYLES: Record<QuoteStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-50 text-blue-700",
  negotiating: "bg-amber-50 text-amber-700",
  accepted: "bg-brand-50 text-brand-700",
  lost: "bg-red-50 text-red-600",
};

const BOOKING_STYLES: Record<BookingStatus, string> = {
  confirmed: "bg-brand-50 text-brand-700",
  options: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-600",
};

export default function StatusBadge({
  status,
}: {
  status: QuoteStatus | BookingStatus;
}) {
  const cls =
    QUOTE_STYLES[status as QuoteStatus] ?? BOOKING_STYLES[status as BookingStatus] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={cx("badge", cls)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

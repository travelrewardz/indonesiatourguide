import { get, all, run, newId, nowIso } from "./db";
import type { AvailabilityRow, Tour, TourOption } from "./types";

/** Errors thrown by the availability/booking engine. */
export class BookingError extends Error {
  code: "SOLD_OUT" | "CLOSED" | "TOO_FEW" | "TOO_MANY" | "NOT_FOUND" | "PAST_DATE";
  constructor(code: BookingError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export type DateAvailability = {
  date: string;
  status: "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "CLOSED";
  capacity: number;
  booked: number;
  remaining: number;
};

export function defaultCapacity(tour: Tour, option?: TourOption | null): number {
  return option?.max_pax ?? tour.max_pax;
}

function deriveStatus(status: string, remaining: number, capacity: number): DateAvailability["status"] {
  if (status === "CLOSED") return "CLOSED";
  if (remaining <= 0) return "SOLD_OUT";
  if (remaining <= Math.max(1, Math.ceil(capacity * 0.25))) return "LIMITED";
  return "AVAILABLE";
}

export function getAvailabilityForDate(tour: Tour, option: TourOption | null, date: string): DateAvailability {
  const row =
    (option ? get<AvailabilityRow>("SELECT * FROM availability WHERE tour_id = ? AND option_id = ? AND date = ?", tour.id, option.id, date) : undefined) ??
    get<AvailabilityRow>("SELECT * FROM availability WHERE tour_id = ? AND option_id = '' AND date = ?", tour.id, date);
  const capacity = defaultCapacity(tour, option);
  if (!row) {
    return { date, status: deriveStatus("AVAILABLE", capacity, capacity), capacity, booked: 0, remaining: capacity };
  }
  const remaining = Math.max(0, row.available_slots - row.booked_slots);
  return { date, status: deriveStatus(row.status, remaining, row.available_slots), capacity: row.available_slots, booked: row.booked_slots, remaining };
}

/** Calendar view: availability for `days` days starting at `startDate` (YYYY-MM-DD). */
export function listAvailability(tour: Tour, option: TourOption | null, startDate: string, days: number): DateAvailability[] {
  const end = new Date(new Date(startDate).getTime() + (days - 1) * 86400000).toISOString().slice(0, 10);
  const rows = all<AvailabilityRow>(
    `SELECT * FROM availability
     WHERE tour_id = ? AND date BETWEEN ? AND ? AND (option_id = '' OR option_id = ?)
     ORDER BY date`,
    tour.id, startDate, end, option?.id ?? "",
  );
  const byDate = new Map<string, AvailabilityRow>();
  for (const r of rows) {
    if (r.option_id === (option?.id ?? "")) byDate.set(r.date, r);
    else if (!byDate.has(r.date)) byDate.set(r.date, r);
  }
  const out: DateAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(new Date(startDate).getTime() + i * 86400000).toISOString().slice(0, 10);
    const row = byDate.get(date);
    const capacity = defaultCapacity(tour, option);
    if (!row) {
      out.push({ date, status: deriveStatus("AVAILABLE", capacity, capacity), capacity, booked: 0, remaining: capacity });
    } else {
      const remaining = Math.max(0, row.available_slots - row.booked_slots);
      out.push({ date, status: deriveStatus(row.status, remaining, row.available_slots), capacity: row.available_slots, booked: row.booked_slots, remaining });
    }
  }
  return out;
}

/**
 * Atomically reserves `pax` slots for a date. MUST be called inside `tx()`.
 * SQLite's BEGIN IMMEDIATE serializes writers, and the guarded UPDATE means a
 * booking can never push booked_slots past available_slots — concurrent
 * checkouts cannot overbook.
 */
export function holdSlots(tour: Tour, option: TourOption | null, date: string, pax: number): void {
  const optionId = option?.id ?? "";
  const capacity = defaultCapacity(tour, option);
  const existing = get<AvailabilityRow>("SELECT * FROM availability WHERE tour_id = ? AND option_id = ? AND date = ?", tour.id, optionId, date);

  if (!existing) {
    if (pax > capacity) throw new BookingError("TOO_MANY", `Only ${capacity} travellers fit on this date.`);
    run(
      "INSERT INTO availability (id, tour_id, option_id, date, available_slots, booked_slots, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)",
      newId("avl"), tour.id, optionId, date, capacity, pax, nowIso(),
    );
    return;
  }

  if (existing.status === "CLOSED") throw new BookingError("CLOSED", "This date is closed for booking.");
  const remaining = existing.available_slots - existing.booked_slots;
  if (remaining < pax) {
    throw new BookingError("SOLD_OUT", remaining <= 0 ? "This date is sold out." : `Only ${remaining} places left on this date.`);
  }
  const res = run(
    `UPDATE availability SET booked_slots = booked_slots + ?, updated_at = ?
     WHERE id = ? AND status != 'CLOSED' AND (available_slots - booked_slots) >= ?`,
    pax, nowIso(), existing.id, pax,
  );
  if (res.changes === 0) throw new BookingError("SOLD_OUT", "This date just sold out. Please choose another date.");
}

/** Returns reserved slots to inventory (cancellation/refund). Call inside `tx()`. */
export function releaseSlots(tourId: string, optionId: string | null, date: string, pax: number): void {
  run(
    "UPDATE availability SET booked_slots = MAX(0, booked_slots - ?), updated_at = ? WHERE tour_id = ? AND option_id = ? AND date = ?",
    pax, nowIso(), tourId, optionId ?? "", date,
  );
}

// ------------------------------------------------------------- admin controls
export function upsertAvailability(opts: {
  tourId: string;
  optionId?: string | null;
  date: string;
  availableSlots?: number;
  status?: "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "CLOSED";
}): void {
  const optionId = opts.optionId ?? "";
  const existing = get<AvailabilityRow>("SELECT * FROM availability WHERE tour_id = ? AND option_id = ? AND date = ?", opts.tourId, optionId, opts.date);
  if (!existing) {
    run(
      "INSERT INTO availability (id, tour_id, option_id, date, available_slots, booked_slots, status, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
      newId("avl"), opts.tourId, optionId, opts.date, opts.availableSlots ?? 0, opts.status ?? "AVAILABLE", nowIso(),
    );
    return;
  }
  run(
    "UPDATE availability SET available_slots = ?, status = ?, updated_at = ? WHERE id = ?",
    opts.availableSlots ?? existing.available_slots, opts.status ?? existing.status, nowIso(), existing.id,
  );
}

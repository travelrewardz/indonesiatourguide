import QRCode from "qrcode";
import { get, all } from "./db";
import { parseItinerary } from "./json";
import type { Booking, Supplier, Tour, TourOption, User } from "./types";

export type VoucherData = {
  booking: Booking;
  tour: Tour;
  option: TourOption | null;
  customer: User | null;
  supplier: { company_name: string; phone: string | null; email: string } | null;
  itinerary: { day: number; time?: string; title: string; description?: string }[];
  includes: string[];
  qrDataUrl: string;
  emergencyPhone: string;
};

/** Assembles everything a printed voucher needs, including a scannable QR code. */
export async function getVoucher(bookingNumber: string): Promise<VoucherData | null> {
  const booking = get<Booking>("SELECT * FROM bookings WHERE booking_number = ?", bookingNumber);
  if (!booking) return null;
  const tour = get<Tour>("SELECT * FROM tours WHERE id = ?", booking.tour_id);
  if (!tour) return null;
  const option = booking.option_id
    ? get<TourOption>("SELECT * FROM tour_options WHERE id = ?", booking.option_id) ?? null
    : null;
  const customer = booking.customer_id ? get<User>("SELECT * FROM users WHERE id = ?", booking.customer_id) ?? null : null;
  const supplier = tour.supplier_id
    ? get<Supplier>("SELECT * FROM suppliers WHERE id = ?", tour.supplier_id) ?? null
    : null;
  const itinerary = parseItinerary(
    all<{ day: number; time: string | null; title: string; description: string | null }>(
      "SELECT day, time, title, description FROM tour_itinerary WHERE tour_id = ? ORDER BY sort_order, day",
      tour.id,
    ),
  );
  const includes = (() => {
    try {
      return JSON.parse(tour.includes) as string[];
    } catch {
      return [];
    }
  })();

  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/account/bookings/${booking.booking_number}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1, color: { dark: "#14201a", light: "#ffffff" } });

  return {
    booking, tour, option, customer, supplier, itinerary, includes, qrDataUrl,
    emergencyPhone: get<{ value: string }>("SELECT value FROM settings WHERE key = 'contact_phone'")?.value ?? "+62 812 3456 7890",
  };
}

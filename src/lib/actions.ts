"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { get, run, all, newId, nowIso } from "./db";
import { getSessionUser } from "./auth";
import { cancelBooking, confirmPayment } from "./booking";
import { upsertAvailability } from "./availability";
import { notify, notifyAdmins, deliverEmails } from "./notify";
import { emails, queueEmail } from "./email";
import { profileSchema } from "./validation";
import { SUPPORTED_CURRENCIES } from "./currency";
import type { Booking, User } from "./types";

/**
 * Server actions — all dashboard mutations.
 * Every action re-checks authentication and role/ownership server-side
 * (never trusts the client), then revalidates affected paths so public pages
 * reflect changes immediately.
 */

async function requireRole(...roles: string[]): Promise<User> {
  const session = await getSessionUser();
  if (!session) throw new Error("Not authenticated");
  const user = get<User>("SELECT * FROM users WHERE id = ?", session.id);
  if (!user) throw new Error("Not authenticated");
  if (!roles.includes(user.role)) throw new Error("Forbidden");
  return user;
}

function ownsBooking(user: User, booking: Booking): boolean {
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return true;
  if (user.role === "CUSTOMER") return booking.customer_id === user.id;
  if (user.role === "TRAVEL_AGENT") {
    const agent = get<{ id: string }>("SELECT id FROM agents WHERE user_id = ?", user.id);
    return !!agent && booking.agent_id === agent.id;
  }
  if (user.role === "SUPPLIER") {
    const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", user.id);
    if (!supplier) return false;
    const tour = get<{ supplier_id: string | null }>("SELECT supplier_id FROM tours WHERE id = ?", booking.tour_id);
    return tour?.supplier_id === supplier.id;
  }
  return false;
}

// ------------------------------------------------------------------ bookings
export async function confirmBookingAction(bookingId: string): Promise<void> {
  const user = await requireRole("SUPPLIER", "ADMIN", "SUPER_ADMIN");
  const booking = get<Booking>("SELECT * FROM bookings WHERE id = ?", bookingId);
  if (!booking || !ownsBooking(user, booking)) throw new Error("Forbidden");
  run(
    "UPDATE bookings SET booking_status = 'CONFIRMED', confirmation_status = 'CONFIRMED', updated_at = ? WHERE id = ?",
    nowIso(), bookingId,
  );
  const tour = get<{ title: string }>("SELECT title FROM tours WHERE id = ?", booking.tour_id);
  if (booking.customer_id) {
    notify(booking.customer_id, "booking", `Booking confirmed — ${booking.booking_number}`,
      `${tour?.title ?? "Your tour"} on ${booking.travel_date} is confirmed.`, "/account/bookings");
  }
  queueEmail(booking.customer_email, booking.customer_name, `Confirmed — ${tour?.title ?? "your tour"}`,
    emails.bookingConfirmed({
      name: booking.customer_name, number: booking.booking_number, tour: tour?.title ?? "",
      date: booking.travel_date, pickup: booking.pickup_location ?? "Hotel pickup",
      href: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/account/bookings/${booking.booking_number}`,
    }));
  void deliverEmails();
  revalidatePath("/admin/bookings");
  revalidatePath("/supplier/bookings");
  revalidatePath(`/account/bookings/${booking.booking_number}`);
}

export async function cancelBookingAction(bookingId: string, reason?: string): Promise<void> {
  const user = await requireRole("CUSTOMER", "TRAVEL_AGENT", "SUPPLIER", "ADMIN", "SUPER_ADMIN");
  const booking = get<Booking>("SELECT * FROM bookings WHERE id = ?", bookingId);
  if (!booking || !ownsBooking(user, booking)) throw new Error("Forbidden");
  cancelBooking(bookingId, reason ?? (user.role === "CUSTOMER" ? "Cancelled by customer" : "Cancelled by operator"));
  revalidatePath("/admin/bookings");
  revalidatePath("/supplier/bookings");
  revalidatePath("/account/bookings");
  revalidatePath("/agents");
}

export async function cancelBookingFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;
  await cancelBookingAction(bookingId, "Cancelled by customer");
}

export async function markPaidAction(bookingId: string): Promise<void> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const booking = get<Booking>("SELECT * FROM bookings WHERE id = ?", bookingId);
  if (!booking) throw new Error("Not found");
  confirmPayment({ bookingId, provider: "bank_transfer", transactionId: `MAN-${Date.now()}` });
  revalidatePath("/admin/bookings");
  revalidatePath(`/account/bookings/${booking.booking_number}`);
}

export async function markCompletedAction(bookingId: string): Promise<void> {
  const user = await requireRole("SUPPLIER", "ADMIN", "SUPER_ADMIN");
  const booking = get<Booking>("SELECT * FROM bookings WHERE id = ?", bookingId);
  if (!booking || !ownsBooking(user, booking)) throw new Error("Forbidden");
  run("UPDATE bookings SET booking_status = 'COMPLETED', updated_at = ? WHERE id = ?", nowIso(), bookingId);
  if (booking.customer_id) {
    notify(booking.customer_id, "review", "How was your trip?",
      `Leave a review for ${booking.booking_number} and help other travellers.`, `/account/bookings/${booking.booking_number}#review`);
  }
  revalidatePath("/admin/bookings");
  revalidatePath("/supplier/bookings");
}

// -------------------------------------------------------------- availability
export async function setAvailabilityAction(input: {
  tourId: string;
  optionId?: string | null;
  date: string;
  availableSlots?: number;
  status?: "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "CLOSED";
}): Promise<void> {
  const user = await requireRole("SUPPLIER", "ADMIN", "SUPER_ADMIN");
  const tour = get<{ supplier_id: string | null }>("SELECT supplier_id FROM tours WHERE id = ?", input.tourId);
  if (!tour) throw new Error("Tour not found");
  if (user.role === "SUPPLIER") {
    const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", user.id);
    if (!supplier || tour.supplier_id !== supplier.id) throw new Error("Forbidden");
  }
  upsertAvailability(input);
  revalidatePath("/supplier/availability");
  revalidatePath("/admin/availability");
  revalidatePath("/tours");
}

// ------------------------------------------------------------------ reviews
export async function moderateReviewAction(reviewId: string, status: "APPROVED" | "REJECTED" | "HIDDEN"): Promise<void> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const review = get<{ tour_id: string }>("SELECT tour_id FROM reviews WHERE id = ?", reviewId);
  if (!review) throw new Error("Not found");
  run("UPDATE reviews SET status = ? WHERE id = ?", status, reviewId);

  if (status === "APPROVED") {
    const agg = get<{ c: number; avg: number }>(
      "SELECT COUNT(*) AS c, AVG(rating) AS avg FROM reviews WHERE tour_id = ? AND status = 'APPROVED'", review.tour_id,
    );
    if (agg && agg.c > 0) {
      run("UPDATE tours SET rating = ?, review_count = ? WHERE id = ?", Math.round(agg.avg * 10) / 10, agg.c, review.tour_id);
    }
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/tours");
}

export async function submitReviewAction(formData: FormData): Promise<void> {
  const user = await requireRole("CUSTOMER", "TRAVEL_AGENT", "ADMIN", "SUPER_ADMIN");
  const bookingNumber = String(formData.get("bookingNumber") ?? "");
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5)));
  const text = String(formData.get("review") ?? "").slice(0, 3000);

  const booking = get<Booking>("SELECT * FROM bookings WHERE booking_number = ?", bookingNumber);
  if (!booking || booking.customer_id !== user.id) throw new Error("Forbidden");
  if (booking.booking_status !== "COMPLETED" && booking.booking_status !== "CONFIRMED") throw new Error("Booking not reviewable");

  run(
    "INSERT INTO reviews (id, booking_id, customer_id, tour_id, author_name, rating, review, photos, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, '[]', 'PENDING', ?)",
    newId("rev"), booking.id, user.id, booking.tour_id, user.name, rating, text, nowIso(),
  );
  notifyAdmins("review", "New review awaiting moderation", `${user.name} rated ${rating}★ — ${text.slice(0, 80)}`, "/admin/reviews");
  revalidatePath(`/account/bookings/${bookingNumber}`);
}

// ---------------------------------------------------------------- enquiries
export async function setEnquiryStatusAction(id: string, status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED"): Promise<void> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  run("UPDATE enquiries SET status = ?, updated_at = ? WHERE id = ?", status, nowIso(), id);
  revalidatePath("/admin/enquiries");
}

// --------------------------------------------------- supplier / agent approval
export async function setSupplierStatusAction(supplierId: string, status: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING"): Promise<void> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  run("UPDATE suppliers SET verification_status = ?, updated_at = ? WHERE id = ?", status, nowIso(), supplierId);
  const supplier = get<{ user_id: string; company_name: string }>("SELECT user_id, company_name FROM suppliers WHERE id = ?", supplierId);
  if (supplier) {
    run("UPDATE users SET status = ?, updated_at = ? WHERE id = ?", status === "APPROVED" ? "ACTIVE" : status === "SUSPENDED" ? "SUSPENDED" : "PENDING", nowIso(), supplier.user_id);
    notify(supplier.user_id, "account", `Supplier account ${status.toLowerCase()}`,
      status === "APPROVED" ? "You can now publish tours and receive bookings." : `Your status is now: ${status}.`, "/supplier");
  }
  void admin;
  revalidatePath("/admin/suppliers");
}

export async function setAgentStatusAction(agentId: string, status: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING", commissionPct?: number): Promise<void> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  run("UPDATE agents SET status = ?, updated_at = ? WHERE id = ?", status, nowIso(), agentId);
  if (typeof commissionPct === "number" && commissionPct >= 0 && commissionPct <= 50) {
    run("UPDATE agents SET commission_pct = ? WHERE id = ?", commissionPct, agentId);
  }
  const agent = get<{ user_id: string }>("SELECT user_id FROM agents WHERE id = ?", agentId);
  if (agent) {
    run("UPDATE users SET status = ?, updated_at = ? WHERE id = ?", status === "APPROVED" ? "ACTIVE" : "PENDING", nowIso(), agent.user_id);
    notify(agent.user_id, "account", `Agency account ${status.toLowerCase()}`,
      status === "APPROVED" ? "Net rates are now unlocked in your portal." : `Your status is now: ${status}.`, "/agents");
  }
  revalidatePath("/admin/agents");
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED" | "PENDING"): Promise<void> {
  const admin = await requireRole("ADMIN", "SUPER_ADMIN");
  if (userId === admin.id && status !== "ACTIVE") throw new Error("You cannot suspend yourself");
  run("UPDATE users SET status = ?, updated_at = ? WHERE id = ?", status, nowIso(), userId);
  revalidatePath("/admin/customers");
}

// -------------------------------------------------------------------- tours
export async function setTourStatusAction(tourId: string, status: "PUBLISHED" | "DRAFT" | "UNPUBLISHED", featured?: boolean): Promise<void> {
  const user = await requireRole("SUPPLIER", "ADMIN", "SUPER_ADMIN");
  const tour = get<{ supplier_id: string | null }>("SELECT supplier_id FROM tours WHERE id = ?", tourId);
  if (!tour) throw new Error("Tour not found");
  if (user.role === "SUPPLIER") {
    const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", user.id);
    if (!supplier || tour.supplier_id !== supplier.id) throw new Error("Forbidden");
  }
  run("UPDATE tours SET status = ?, featured = COALESCE(?, featured), updated_at = ? WHERE id = ?",
    status, typeof featured === "boolean" ? (featured ? 1 : 0) : null, nowIso(), tourId);
  revalidatePath("/tours");
  revalidatePath("/admin/tours");
  revalidatePath("/supplier/tours");
  revalidatePath("/");
}

export async function deleteTourAction(tourId: string): Promise<void> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  void user;
  run("DELETE FROM tours WHERE id = ?", tourId);
  revalidatePath("/tours");
  revalidatePath("/admin/tours");
}

// ------------------------------------------------------------------ profile
export async function updateProfileAction(_prev: { error?: string; ok?: boolean }, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated" };
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    preferred_language: formData.get("preferred_language"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  run(
    "UPDATE users SET name = ?, phone = ?, country = ?, preferred_language = ?, updated_at = ? WHERE id = ?",
    parsed.data.name, parsed.data.phone || null, parsed.data.country || null,
    parsed.data.preferred_language || "en", nowIso(), session.id,
  );
  revalidatePath("/account/profile");
  return { ok: true };
}

/**
 * Supplier profile settings — the preferred currency is applied automatically
 * as the pricing currency for tours this supplier creates.
 */
export async function updateSupplierProfileAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated" };
  const supplier = get<{ id: string }>("SELECT id FROM suppliers WHERE user_id = ?", session.id);
  if (!supplier) return { error: "No supplier profile is linked to this account" };

  const company_name = String(formData.get("company_name") ?? "").trim().slice(0, 150);
  const contact_person = String(formData.get("contact_person") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  const address = String(formData.get("address") ?? "").trim().slice(0, 300);
  const preferred_currency = String(formData.get("preferred_currency") ?? "USD").toUpperCase();

  if (company_name.length < 2) return { error: "Company name is required" };
  if (contact_person.length < 2) return { error: "Contact person is required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "A valid contact email is required" };
  if (!SUPPORTED_CURRENCIES.includes(preferred_currency)) return { error: "Unsupported currency" };

  run(
    `UPDATE suppliers SET company_name = ?, contact_person = ?, email = ?, phone = ?, address = ?,
      preferred_currency = ?, updated_at = ? WHERE id = ?`,
    company_name, contact_person, email, phone || null, address || null,
    preferred_currency, nowIso(), supplier.id,
  );
  revalidatePath("/supplier/settings");
  revalidatePath("/supplier");
  return { ok: true };
}

export async function changePasswordAction(_prev: { error?: string; ok?: boolean }, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSessionUser();
  if (!session) return { error: "Not authenticated" };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters" };
  const user = get<User>("SELECT * FROM users WHERE id = ?", session.id);
  if (!user) return { error: "Not authenticated" };
  const { verifyPassword, hashPassword } = await import("./auth");
  if (user.password_hash && !verifyPassword(current, user.password_hash)) return { error: "Current password is incorrect" };
  run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", hashPassword(next), nowIso(), session.id);
  return { ok: true };
}

// ------------------------------------------------------------------- quotes
export async function createQuoteAction(formData: FormData): Promise<{ ok?: boolean; error?: string; reference?: string }> {
  const user = await requireRole("TRAVEL_AGENT", "ADMIN", "SUPER_ADMIN");
  const agent = get<{ id: string; status: string }>("SELECT id, status FROM agents WHERE user_id = ?", user.id);
  if (!agent || (agent.status !== "APPROVED" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return { error: "Your agency account must be approved to create quotes" };
  }
  const tourId = String(formData.get("tourId") ?? "");
  const travelDate = String(formData.get("travelDate") ?? "");
  const pax = Math.max(1, Number(formData.get("pax") ?? 1));
  const customerName = String(formData.get("customerName") ?? "").slice(0, 120);
  const notes = String(formData.get("notes") ?? "").slice(0, 2000);
  if (!tourId || !/^\d{4}-\d{2}-\d{2}$/.test(travelDate)) return { error: "Tour and travel date are required" };

  const tour = get<{
    id: string; base_price: number; agent_price: number | null; sale_price: number | null; agent_discount_pct: number | null;
  }>(
    "SELECT id, base_price, agent_price, sale_price, agent_discount_pct FROM tours WHERE id = ? AND status = 'PUBLISHED'", tourId,
  );
  if (!tour) return { error: "Tour not found" };

  const unit = tour.sale_price && tour.sale_price > 0 ? tour.sale_price : tour.base_price;
  const gross = unit * pax;
  // Explicit agent net price wins; otherwise the supplier's discount percentage;
  // with neither set the supplier accepts no agent/member discount (net = retail).
  const net =
    tour.agent_price != null
      ? tour.agent_price * pax
      : tour.agent_discount_pct != null && tour.agent_discount_pct > 0
        ? Math.round(gross * (1 - tour.agent_discount_pct / 100) * 100) / 100
        : gross;
  const reference = `QT-${new Date().getFullYear()}-${String(all("SELECT id FROM quotes").length + 1).padStart(4, "0")}`;

  run(
    `INSERT INTO quotes (id, reference, agent_id, tour_id, option_id, customer_name, travel_date, pax, net_total, gross_total, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, 'SENT', ?, ?, ?)`,
    newId("qte"), reference, agent.id, tourId, customerName || null, travelDate, pax,
    Math.round(net * 100) / 100, Math.round(gross * 100) / 100, notes || null, nowIso(), nowIso(),
  );
  notifyAdmins("quote", `New quote ${reference}`, `${customerName || "Customer"} — ${pax} pax, net $${Math.round(net)}.`, "/admin/bookings");
  revalidatePath("/agents");
  return { ok: true, reference };
}

export async function setQuoteStatusAction(quoteId: string, status: "DRAFT" | "SENT" | "NEGOTIATING" | "ACCEPTED" | "LOST"): Promise<void> {
  const user = await requireRole("TRAVEL_AGENT", "ADMIN", "SUPER_ADMIN");
  const quote = get<{ agent_id: string }>("SELECT agent_id FROM quotes WHERE id = ?", quoteId);
  if (!quote) throw new Error("Not found");
  if (user.role === "TRAVEL_AGENT") {
    const agent = get<{ id: string }>("SELECT id FROM agents WHERE user_id = ?", user.id);
    if (!agent || quote.agent_id !== agent.id) throw new Error("Forbidden");
  }
  run("UPDATE quotes SET status = ?, updated_at = ? WHERE id = ?", status, nowIso(), quoteId);
  revalidatePath("/agents");
}

// --------------------------------------------------------------------- CMS
export async function updateCmsPageAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").slice(0, 200);
  const content = String(formData.get("content") ?? "").slice(0, 100000);
  const seoTitle = String(formData.get("seo_title") ?? "").slice(0, 200) || null;
  const seoDescription = String(formData.get("seo_description") ?? "").slice(0, 300) || null;
  run(
    "UPDATE cms_pages SET title = ?, content = ?, seo_title = ?, seo_description = ?, updated_at = ? WHERE slug = ?",
    title, content, seoTitle, seoDescription, nowIso(), slug,
  );
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/cms");
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const keys = ["company_name", "contact_email", "contact_phone", "whatsapp_number", "address", "instagram", "facebook", "license"];
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") {
      run(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        key, value, nowIso(),
      );
    }
  }
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------- notifications
/**
 * Form-friendly wrappers (a <form action> passes FormData as the first arg —
 * these read hidden inputs so bound arguments never collide with it).
 */
export async function saveDestinationFormAction(formData: FormData): Promise<void> {
  const res = await saveDestinationAction(formData);
  if (res.error) redirect(`/admin/destinations?error=${encodeURIComponent(res.error)}`);
  redirect("/admin/destinations?saved=1");
}

export async function saveBlogPostFormAction(formData: FormData): Promise<void> {
  const res = await saveBlogPostAction(formData);
  if (res.error) redirect(`/admin/cms/blog/${formData.get("id") || "new"}?error=${encodeURIComponent(res.error)}`);
  redirect("/admin/cms?saved=1");
}

export async function setTourStatusFormAction(formData: FormData): Promise<void> {
  const tourId = String(formData.get("tourId") ?? "");
  const status = String(formData.get("status") ?? "PUBLISHED") as "PUBLISHED" | "DRAFT" | "UNPUBLISHED";
  if (tourId) await setTourStatusAction(tourId, status);
}

export async function deleteTourFormAction(formData: FormData): Promise<void> {
  const tourId = String(formData.get("tourId") ?? "");
  if (tourId) await deleteTourAction(tourId);
}

export async function confirmBookingFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (bookingId) await confirmBookingAction(bookingId);
}

export async function completeBookingFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (bookingId) await markCompletedAction(bookingId);
}

export async function markPaidFormAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (bookingId) await markPaidAction(bookingId);
}

export async function moderateReviewFormAction(formData: FormData): Promise<void> {
  const reviewId = String(formData.get("reviewId") ?? "");
  const status = String(formData.get("status") ?? "APPROVED") as "APPROVED" | "REJECTED" | "HIDDEN";
  if (reviewId) await moderateReviewAction(reviewId, status);
}

export async function setEnquiryStatusFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "NEW") as "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED";
  if (id) await setEnquiryStatusAction(id, status);
}

export async function setSupplierStatusFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get("supplierId") ?? "");
  const status = String(formData.get("status") ?? "APPROVED") as "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING";
  if (id) await setSupplierStatusAction(id, status);
}

export async function setAgentStatusFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get("agentId") ?? "");
  const status = String(formData.get("status") ?? "APPROVED") as "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING";
  const pct = formData.get("commission_pct");
  if (id) await setAgentStatusAction(id, status, pct != null && pct !== "" ? Number(pct) : undefined);
}

export async function setUserStatusFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "ACTIVE") as "ACTIVE" | "SUSPENDED" | "PENDING";
  if (id) await setUserStatusAction(id, status);
}

export async function setQuoteStatusFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get("quoteId") ?? "");
  const status = String(formData.get("status") ?? "SENT") as "DRAFT" | "SENT" | "NEGOTIATING" | "ACCEPTED" | "LOST";
  if (id) await setQuoteStatusAction(id, status);
}

// ----------------------------------------------------------------- CMS pages
export async function saveDestinationAction(formData: FormData): Promise<{ error?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) return { error: "Name is required" };
  const { slugify } = await import("./format");
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const data = {
    name,
    slug,
    region: String(formData.get("region") ?? "").slice(0, 80) || null,
    tagline: String(formData.get("tagline") ?? "").slice(0, 120) || null,
    description: String(formData.get("description") ?? "").slice(0, 8000) || null,
    hero_image: String(formData.get("hero_image") ?? "").slice(0, 1000) || null,
    gallery: String(formData.get("gallery") ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12),
    seo_title: String(formData.get("seo_title") ?? "").slice(0, 200) || null,
    seo_description: String(formData.get("seo_description") ?? "").slice(0, 400) || null,
    seo_keywords: String(formData.get("seo_keywords") ?? "").slice(0, 400) || null,
    featured: formData.get("featured") === "on" ? 1 : 0,
  };

  if (id) {
    const existing = get<{ id: string }>("SELECT id FROM destinations WHERE id = ?", id);
    if (!existing) return { error: "Destination not found" };
    run(
      `UPDATE destinations SET name = ?, slug = ?, region = ?, tagline = ?, description = ?, hero_image = ?, gallery = ?,
        seo_title = ?, seo_description = ?, seo_keywords = ?, featured = ?, updated_at = ? WHERE id = ?`,
      data.name, data.slug, data.region, data.tagline, data.description, data.hero_image, JSON.stringify(data.gallery),
      data.seo_title, data.seo_description, data.seo_keywords, data.featured, nowIso(), id,
    );
  } else {
    const clash = get<{ id: string }>("SELECT id FROM destinations WHERE slug = ?", data.slug);
    if (clash) return { error: "A destination with this slug already exists" };
    const nextOrder = (get<{ m: number | null }>("SELECT MAX(sort_order) AS m FROM destinations")?.m ?? 0) + 1;
    run(
      `INSERT INTO destinations (id, name, slug, region, tagline, description, hero_image, gallery, seo_title,
        seo_description, seo_keywords, featured, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId("dst"), data.name, data.slug, data.region, data.tagline, data.description, data.hero_image,
      JSON.stringify(data.gallery), data.seo_title, data.seo_description, data.seo_keywords, data.featured,
      nextOrder, nowIso(), nowIso(),
    );
  }
  revalidatePath("/destinations");
  revalidatePath("/admin/destinations");
  return {};
}

export async function deleteDestinationAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) run("DELETE FROM destinations WHERE id = ?", id);
  revalidatePath("/destinations");
  revalidatePath("/admin/destinations");
}

export async function saveBlogPostAction(formData: FormData): Promise<{ error?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return { error: "Title is required" };
  const { slugify } = await import("./format");
  const slug = slugify(String(formData.get("slug") ?? "") || title);
  const status = formData.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const content = String(formData.get("content") ?? "").slice(0, 200000);
  const excerpt = String(formData.get("excerpt") ?? "").slice(0, 500) || null;
  const publishedAt = status === "PUBLISHED" ? String(formData.get("published_at") ?? "") || nowIso() : null;
  const destSlug = String(formData.get("destination_slug") ?? "");
  const dest = destSlug ? get<{ id: string }>("SELECT id FROM destinations WHERE slug = ?", destSlug) : undefined;

  const fields = [
    title, slug, String(formData.get("author") ?? "").slice(0, 120) || null,
    String(formData.get("cover_image") ?? "").slice(0, 1000) || null, content, excerpt,
    dest?.id ?? null, String(formData.get("category") ?? "").slice(0, 80) || null,
    String(formData.get("seo_title") ?? "").slice(0, 200) || null,
    String(formData.get("seo_description") ?? "").slice(0, 400) || null,
    status, publishedAt,
  ];

  if (id) {
    run(
      `UPDATE blog_posts SET title = ?, slug = ?, author = ?, cover_image = ?, content = ?, excerpt = ?,
        destination_id = ?, category = ?, seo_title = ?, seo_description = ?, status = ?, published_at = ?, updated_at = ?
       WHERE id = ?`,
      ...fields, nowIso(), id,
    );
  } else {
    const clash = get<{ id: string }>("SELECT id FROM blog_posts WHERE slug = ?", slug);
    if (clash) return { error: "A post with this slug already exists" };
    run(
      `INSERT INTO blog_posts (id, title, slug, author, cover_image, content, excerpt, destination_id, category,
        seo_title, seo_description, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId("blg"), ...fields, nowIso(), nowIso(),
    );
  }
  revalidatePath("/blog");
  revalidatePath("/admin/cms");
  return {};
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN", "SUPER_ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) run("DELETE FROM blog_posts WHERE id = ?", id);
  revalidatePath("/blog");
  revalidatePath("/admin/cms");
}

export async function markNotificationsReadAction(): Promise<void> {
  const session = await getSessionUser();
  if (!session) return;
  run("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", nowIso(), session.id);
  revalidatePath("/", "layout");
}

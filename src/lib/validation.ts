import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  role: z.enum(["CUSTOMER", "TRAVEL_AGENT", "SUPPLIER"]).default("CUSTOMER"),
  company: z.string().trim().max(150).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const enquirySchema = z.object({
  type: z.enum(["contact", "tailor_made", "quote"]).default("contact"),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  tour_slug: z.string().trim().max(200).optional().or(z.literal("")),
  destination: z.string().trim().max(120).optional().or(z.literal("")),
  travel_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  pax: z.coerce.number().int().min(1).max(100).optional(),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  interests: z.string().trim().max(300).optional().or(z.literal("")),
  accommodation: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please tell us a little more").max(5000),
});

export const bookingSchema = z.object({
  tourSlug: z.string().min(1),
  optionId: z.string().optional().nullable(),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid travel date"),
  adults: z.coerce.number().int().min(1).max(50),
  children: z.coerce.number().int().min(0).max(50),
  pickupLocation: z.string().trim().min(2).max(300),
  hotel: z.string().trim().max(300).optional().or(z.literal("")),
  specialRequest: z.string().trim().max(3000).optional().or(z.literal("")),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().toLowerCase().email().max(200),
  customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
  paymentProvider: z.enum(["sandbox", "midtrans", "bank_transfer"]).default("sandbox"),
  agree: z.coerce.boolean().default(false),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  preferred_language: z.string().trim().max(10).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  review: z.string().trim().max(3000).optional().or(z.literal("")),
});

const faqItem = z.object({ q: z.string().trim().min(2).max(300), a: z.string().trim().min(2).max(2000) });

export const tourSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().max(200).optional().or(z.literal("")),
  short_description: z.string().trim().max(600).optional().or(z.literal("")),
  full_description: z.string().trim().max(30000).optional().or(z.literal("")),
  destination_slug: z.string().trim().max(200).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  duration_days: z.coerce.number().int().min(1).max(60),
  duration_text: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  difficulty: z.string().trim().max(40).optional().or(z.literal("")),
  min_pax: z.coerce.number().int().min(1).max(100),
  max_pax: z.coerce.number().int().min(1).max(500),
  base_price: z.coerce.number().min(0).max(1_000_000),
  sale_price: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
  agent_price: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]).default("DRAFT"),
  featured: z.coerce.boolean().default(false),
  pickup_info: z.string().trim().max(2000).optional().or(z.literal("")),
  map_lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  map_lng: z.coerce.number().min(-180).max(180).nullable().optional(),
  seo_title: z.string().trim().max(200).optional().or(z.literal("")),
  seo_description: z.string().trim().max(400).optional().or(z.literal("")),
  seo_keywords: z.string().trim().max(400).optional().or(z.literal("")),
  supplier_id: z.string().trim().max(60).optional().or(z.literal("")),
  highlights: z.array(z.string().trim().max(300)).max(30).default([]),
  includes: z.array(z.string().trim().max(300)).max(40).default([]),
  excludes: z.array(z.string().trim().max(300)).max(40).default([]),
  faqs: z.array(faqItem).max(30).default([]),
  images: z.array(z.object({
    image_url: z.string().trim().url().max(1000),
    alt_text: z.string().trim().max(200).optional().or(z.literal("")),
  })).max(12).default([]),
  itinerary: z.array(z.object({
    day: z.coerce.number().int().min(1).max(60),
    time: z.string().trim().max(40).optional().or(z.literal("")),
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
  })).max(60).default([]),
  options: z.array(z.object({
    name: z.string().trim().min(1).max(150),
    price: z.coerce.number().min(0).max(1_000_000),
    min_pax: z.coerce.number().int().min(1).max(100),
    max_pax: z.coerce.number().int().min(1).max(500),
    duration_text: z.string().trim().max(80).optional().or(z.literal("")),
    inclusions: z.array(z.string().trim().max(300)).max(30).default([]),
    exclusions: z.array(z.string().trim().max(300)).max(30).default([]),
    is_available: z.coerce.boolean().default(true),
  })).max(10).default([]),
});

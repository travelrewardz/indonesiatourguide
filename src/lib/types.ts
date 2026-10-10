/** Database row types and shared domain types. */

export type UserRole = "CUSTOMER" | "TRAVEL_AGENT" | "SUPPLIER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  password_hash: string;
  auth_provider: "credentials" | "google";
  provider_id: string | null;
  role: UserRole;
  status: UserStatus;
  preferred_language: string;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
  id: string;
  user_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  address: string | null;
  destinations: string; // JSON array
  license_number: string | null;
  verification_status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  bank_info: string | null;
  commission_pct: number;
  created_at: string;
  updated_at: string;
};

export type Agent = {
  id: string;
  user_id: string;
  company: string;
  contact_person: string;
  email: string;
  phone: string | null;
  country: string | null;
  website: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  commission_pct: number;
  net_rate_access: number;
  created_at: string;
  updated_at: string;
};

export type Destination = {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  tagline: string | null;
  description: string | null;
  hero_image: string | null;
  gallery: string; // JSON array
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  featured: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TourStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";

export type Tour = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  full_description: string | null;
  destination_id: string | null;
  destinations: string; // JSON array of destination slugs (first = primary)
  regions: string; // JSON array of region names
  categories: string; // JSON array of category names
  region: string | null;
  duration_days: number;
  duration_text: string | null;
  category: string | null;
  difficulty: string | null;
  min_pax: number;
  max_pax: number;
  base_price: number;
  sale_price: number | null;
  currency: string;
  agent_price: number | null;
  agent_discount_pct: number | null; // NULL = agents/members pay retail
  supplier_id: string | null;
  rating: number;
  review_count: number;
  status: TourStatus;
  featured: number;
  highlights: string; // JSON array
  includes: string; // JSON array
  excludes: string; // JSON array
  pickup_info: string | null;
  faqs: string; // JSON array of {q,a}
  map_lat: number | null;
  map_lng: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
};

export type TourImage = {
  id: string;
  tour_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
};

export type TourItineraryItem = {
  id: string;
  tour_id: string;
  day: number;
  time: string | null;
  title: string;
  description: string | null;
  sort_order: number;
};

export type TourPriceTier = {
  id: string;
  tour_id: string;
  option_id: string; // '' = tour-level ladder
  label: string | null;
  min_pax: number;
  max_pax: number | null; // null = no upper limit
  price: number;
  sort_order: number;
};

export type TourOption = {
  id: string;
  tour_id: string;
  name: string;
  description: string | null;
  price: number;
  min_pax: number;
  max_pax: number;
  duration_text: string | null;
  inclusions: string; // JSON array
  exclusions: string; // JSON array
  is_available: number;
  sort_order: number;
};

export type AvailabilityStatus = "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "CLOSED";

export type AvailabilityRow = {
  id: string;
  tour_id: string;
  option_id: string;
  date: string;
  available_slots: number;
  booked_slots: number;
  status: AvailabilityStatus;
  updated_at: string;
};

export type PriceRule = {
  id: string;
  tour_id: string;
  option_id: string;
  date_from: string;
  date_to: string;
  price: number;
  label: string | null;
  created_at: string;
};

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";

export type Booking = {
  id: string;
  booking_number: string;
  customer_id: string | null;
  tour_id: string;
  option_id: string | null;
  travel_date: string;
  pax: number;
  adults: number;
  children: number;
  pickup_location: string | null;
  hotel: string | null;
  special_request: string | null;
  total_price: number;
  currency: string;
  commission: number;
  supplier_amount: number;
  agent_id: string | null;
  agent_net_total: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  confirmation_status: "UNCONFIRMED" | "CONFIRMED";
  source: string;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  booking_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  transaction_id: string | null;
  payment_date: string | null;
  payload: string;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  booking_id: string | null;
  customer_id: string | null;
  tour_id: string;
  author_name: string;
  rating: number;
  review: string | null;
  photos: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  created_at: string;
};

export type Enquiry = {
  id: string;
  type: "contact" | "tailor_made" | "quote";
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  tour_slug: string | null;
  destination: string | null;
  travel_date: string | null;
  pax: number | null;
  budget: string | null;
  interests: string | null;
  accommodation: string | null;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED";
  created_at: string;
  updated_at: string;
};

export type Quote = {
  id: string;
  reference: string;
  agent_id: string;
  tour_id: string;
  option_id: string | null;
  customer_name: string | null;
  travel_date: string;
  pax: number;
  net_total: number;
  gross_total: number;
  status: "DRAFT" | "SENT" | "NEGOTIATING" | "ACCEPTED" | "LOST";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  cover_image: string | null;
  content: string;
  excerpt: string | null;
  destination_id: string | null;
  category: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

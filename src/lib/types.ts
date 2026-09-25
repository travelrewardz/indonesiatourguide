export type PartnerTier = "standard" | "silver" | "gold" | "platinum";

export type Partner = {
  id: string;
  companyName: string;
  contactName: string;
  email: string; // unique
  passwordHash: string;
  country: string;
  phone?: string;
  website?: string;
  tier: PartnerTier;
  approved: boolean;
  createdAt: string; // ISO
};

export type QuoteStatus = "draft" | "sent" | "negotiating" | "accepted" | "lost";
export type BookingStatus = "confirmed" | "options" | "cancelled";

export type Quote = {
  id: string;
  partnerId: string;
  tourSlug: string;
  travelDate: string; // ISO date
  pax: number;
  language: string;
  notes?: string;
  netPerPerson: number; // USD at quote time
  netTotal: number;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  partnerId: string;
  quoteId?: string;
  tourSlug: string;
  confirmationCode: string;
  travelDate: string;
  pax: number;
  language: string;
  grossTotal: number;
  netTotal: number;
  status: BookingStatus;
  createdAt: string;
};

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  country?: string;
  tourSlug?: string;
  travelDate?: string;
  pax?: number;
  language?: string;
  message: string;
  createdAt: string;
};

export type Db = {
  partners: Partner[];
  quotes: Quote[];
  bookings: Booking[];
  enquiries: Enquiry[];
};

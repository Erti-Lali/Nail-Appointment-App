// ============================================================
// Nail Studio 101 — Database Types (Supabase)
// Multi-tenant SaaS schema
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ────────────────────────────────────────────────

export type SubscriptionPlan = "starter" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "paused";
export type AppointmentStatus = "pending" | "confirmed" | "in_progress" | "completed" | "canceled" | "no_show";
export type StaffRole = "owner" | "manager" | "technician" | "receptionist";
export type UserRole = "super_admin" | "tenant_admin" | "staff" | "customer";
export type Gender = "female" | "male" | "other" | "prefer_not_to_say";
export type NotificationChannel = "sms" | "email" | "push" | "whatsapp";
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

// ─── Tenant (Nail Studio) ─────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string; // unique subdomain: studio-name.nailstudio101.com
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string; // e.g. "Europe/Istanbul"
  currency: string; // e.g. "TRY"
  locale: string; // e.g. "tr"
  // Brand colors
  primary_color: string; // default "#C9A84C" (gold)
  secondary_color: string; // default "#1A1A1A" (black)
  // Settings
  booking_advance_days: number; // how many days ahead can book
  cancellation_hours: number; // hours before appointment to allow cancellation
  reminder_hours: number[]; // e.g. [24, 2] = 24h and 2h before
  // Integrations
  instagram_handle: string | null;
  google_maps_url: string | null;
  // Meta
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Subscription ─────────────────────────────────────────

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Users & Auth ─────────────────────────────────────────

export interface Profile {
  id: string; // = auth.users.id
  tenant_id: string | null; // null = super admin
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  gender: Gender | null;
  birth_date: string | null;
  preferred_language: string; // "tr" | "en"
  notification_preferences: NotificationChannel[];
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Customer (extended profile for customers) ────────────

export interface Customer {
  id: string;
  tenant_id: string;
  profile_id: string | null; // null = walk-in / guest
  // Contact (for guests without account)
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  // Customer details
  gender: Gender | null;
  birth_date: string | null;
  notes: string | null; // staff notes
  tags: string[];
  // Loyalty
  total_visits: number;
  total_spent: number;
  loyalty_points: number;
  // Referral
  referred_by_id: string | null;
  // Meta
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Staff ────────────────────────────────────────────────

export interface Staff {
  id: string;
  tenant_id: string;
  profile_id: string;
  role: StaffRole;
  display_name: string; // shown to customers
  bio: string | null;
  avatar_url: string | null;
  specialties: string[]; // e.g. ["gel", "nail-art", "manicure"]
  color: string; // calendar color e.g. "#E91E63"
  is_active: boolean;
  accepts_online_booking: boolean;
  booking_buffer_minutes: number; // break time between appointments
  created_at: string;
  updated_at: string;
}

// ─── Staff Working Hours ──────────────────────────────────

export interface StaffWorkingHours {
  id: string;
  staff_id: string;
  tenant_id: string;
  day_of_week: DayOfWeek;
  is_working: boolean;
  start_time: string; // "09:00"
  end_time: string; // "18:00"
  break_start: string | null; // "12:00"
  break_end: string | null; // "13:00"
}

// ─── Staff Time Off ───────────────────────────────────────

export interface StaffTimeOff {
  id: string;
  staff_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

// ─── Service Category ─────────────────────────────────────

export interface ServiceCategory {
  id: string;
  tenant_id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  icon: string | null; // emoji or icon name
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

// ─── Service ──────────────────────────────────────────────

export interface Service {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  duration_minutes: number;
  price: number;
  price_max: number | null; // for range pricing
  deposit_required: boolean;
  deposit_amount: number | null;
  max_parallel: number; // how many can be booked at same time
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Service ↔ Staff mapping ──────────────────────────────

export interface ServiceStaff {
  service_id: string;
  staff_id: string;
  custom_duration: number | null;
  custom_price: number | null;
}

// ─── Appointment ──────────────────────────────────────────

export interface Appointment {
  id: string;
  tenant_id: string;
  customer_id: string;
  staff_id: string;
  service_id: string;
  status: AppointmentStatus;
  starts_at: string; // ISO datetime
  ends_at: string;
  duration_minutes: number;
  // Pricing
  price: number;
  discount_amount: number;
  final_price: number;
  deposit_paid: number;
  // Notes
  customer_notes: string | null;
  staff_notes: string | null;
  // Reminders
  reminder_sent_at: string | null;
  // Source
  booked_via: "online" | "phone" | "walk_in" | "instagram" | "admin";
  // Cancellation
  canceled_at: string | null;
  canceled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Appointment ↔ Service (multi-service booking) ───────

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  staff_id: string;
  duration_minutes: number;
  price: number;
  sort_order: number;
}

// ─── Notification ─────────────────────────────────────────

export interface Notification {
  id: string;
  tenant_id: string;
  recipient_id: string; // profile_id
  channel: NotificationChannel;
  type: string; // e.g. "appointment_reminder", "booking_confirmed"
  title: string;
  body: string;
  data: Json | null;
  is_read: boolean;
  sent_at: string | null;
  failed_at: string | null;
  created_at: string;
}

// ─── Reviews ──────────────────────────────────────────────

export interface Review {
  id: string;
  tenant_id: string;
  customer_id: string;
  appointment_id: string;
  staff_id: string | null;
  rating: number; // 1-5
  comment: string | null;
  reply: string | null;
  replied_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Tenant Content (CMS) ─────────────────────────────────

export interface TenantContent {
  id: string;
  tenant_id: string;
  type: "gallery" | "before_after" | "announcement" | "offer";
  title: string | null;
  description: string | null;
  image_url: string;
  link_url: string | null;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
}

// ─── Aggregated types (with joins) ────────────────────────

export interface AppointmentWithRelations extends Appointment {
  customer: Customer;
  staff: Staff;
  service: Service;
}

export interface StaffWithSchedule extends Staff {
  working_hours: StaffWorkingHours[];
  time_offs: StaffTimeOff[];
}

export interface ServiceWithCategory extends Service {
  category: ServiceCategory;
  staff: Staff[];
}

// ─── API Response wrappers ────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

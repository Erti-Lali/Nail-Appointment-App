// Auto-generated from Supabase schema (project ukkjamcqwcfxdhqpkcvx).
// Regenerate with: supabase gen types typescript  (or the MCP generate tool).
// Do not edit by hand — used to type the Supabase client end-to-end.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      appointment_services: {
        Row: { appointment_id: string; created_at: string | null; duration_minutes: number; id: string; price: number; service_id: string; tenant_id: string };
        Insert: { appointment_id: string; created_at?: string | null; duration_minutes?: number; id?: string; price?: number; service_id: string; tenant_id: string };
        Update: { appointment_id?: string; created_at?: string | null; duration_minutes?: number; id?: string; price?: number; service_id?: string; tenant_id?: string };
        Relationships: [];
      };
      appointments: {
        Row: { booked_via: Database["public"]["Enums"]["booking_source"] | null; canceled_at: string | null; canceled_by: string | null; cancellation_reason: string | null; created_at: string | null; customer_id: string; customer_notes: string | null; deposit_paid: number | null; discount_amount: number | null; duration_minutes: number; ends_at: string; final_price: number; id: string; price: number; reminder_sent_at: string | null; service_id: string; staff_id: string; staff_notes: string | null; starts_at: string; status: Database["public"]["Enums"]["appointment_status"] | null; tenant_id: string; updated_at: string | null };
        Insert: { booked_via?: Database["public"]["Enums"]["booking_source"] | null; canceled_at?: string | null; canceled_by?: string | null; cancellation_reason?: string | null; created_at?: string | null; customer_id: string; customer_notes?: string | null; deposit_paid?: number | null; discount_amount?: number | null; duration_minutes: number; ends_at: string; final_price: number; id?: string; price: number; reminder_sent_at?: string | null; service_id: string; staff_id: string; staff_notes?: string | null; starts_at: string; status?: Database["public"]["Enums"]["appointment_status"] | null; tenant_id: string; updated_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: { birth_date: string | null; blacklist_reason: string | null; created_at: string | null; email: string | null; first_name: string; gender: Database["public"]["Enums"]["gender_type"] | null; id: string; is_blacklisted: boolean | null; last_name: string; loyalty_points: number | null; notes: string | null; phone: string; profile_id: string | null; referred_by_id: string | null; tags: string[] | null; tenant_id: string; total_spent: number | null; total_visits: number | null; updated_at: string | null };
        Insert: { birth_date?: string | null; blacklist_reason?: string | null; created_at?: string | null; email?: string | null; first_name: string; gender?: Database["public"]["Enums"]["gender_type"] | null; id?: string; is_blacklisted?: boolean | null; last_name: string; loyalty_points?: number | null; notes?: string | null; phone: string; profile_id?: string | null; referred_by_id?: string | null; tags?: string[] | null; tenant_id: string; total_spent?: number | null; total_visits?: number | null; updated_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      customer_favorites: {
        Row: { id: string; profile_id: string; tenant_id: string | null; service_id: string | null; type: string; created_at: string | null };
        Insert: { id?: string; profile_id: string; tenant_id?: string | null; service_id?: string | null; type: string; created_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["customer_favorites"]["Insert"]>;
        Relationships: [];
      };
      appointment_reminders: {
        Row: { id: string; appointment_id: string; tenant_id: string; channel: string; scheduled_at: string; sent_at: string | null; failed_at: string | null; error: string | null; created_at: string | null };
        Insert: { id?: string; appointment_id: string; tenant_id: string; channel: string; scheduled_at: string; sent_at?: string | null; failed_at?: string | null; error?: string | null; created_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["appointment_reminders"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: { body: string; channel: Database["public"]["Enums"]["notification_channel"]; created_at: string | null; data: Json | null; failed_at: string | null; id: string; is_read: boolean | null; recipient_id: string; sent_at: string | null; tenant_id: string; title: string; type: string };
        Insert: { body: string; channel: Database["public"]["Enums"]["notification_channel"]; created_at?: string | null; data?: Json | null; failed_at?: string | null; id?: string; is_read?: boolean | null; recipient_id: string; sent_at?: string | null; tenant_id: string; title: string; type: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: { avatar_url: string | null; birth_date: string | null; created_at: string | null; first_name: string; gender: Database["public"]["Enums"]["gender_type"] | null; id: string; is_active: boolean | null; last_name: string; last_seen_at: string | null; notification_preferences: Database["public"]["Enums"]["notification_channel"][] | null; phone: string | null; preferred_language: string | null; role: Database["public"]["Enums"]["user_role"] | null; tenant_id: string | null; updated_at: string | null };
        Insert: { avatar_url?: string | null; birth_date?: string | null; created_at?: string | null; first_name: string; gender?: Database["public"]["Enums"]["gender_type"] | null; id: string; is_active?: boolean | null; last_name: string; last_seen_at?: string | null; notification_preferences?: Database["public"]["Enums"]["notification_channel"][] | null; phone?: string | null; preferred_language?: string | null; role?: Database["public"]["Enums"]["user_role"] | null; tenant_id?: string | null; updated_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: { appointment_id: string; comment: string | null; created_at: string | null; customer_id: string; id: string; is_public: boolean | null; rating: number; replied_at: string | null; reply: string | null; staff_id: string | null; tenant_id: string; updated_at: string | null };
        Insert: { appointment_id: string; comment?: string | null; created_at?: string | null; customer_id: string; id?: string; is_public?: boolean | null; rating: number; replied_at?: string | null; reply?: string | null; staff_id?: string | null; tenant_id: string; updated_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
      service_categories: {
        Row: { color: string | null; description: string | null; icon: string | null; id: string; is_active: boolean | null; name: string; name_en: string | null; sort_order: number | null; tenant_id: string };
        Insert: { color?: string | null; description?: string | null; icon?: string | null; id?: string; is_active?: boolean | null; name: string; name_en?: string | null; sort_order?: number | null; tenant_id: string };
        Update: Partial<Database["public"]["Tables"]["service_categories"]["Insert"]>;
        Relationships: [];
      };
      service_staff: {
        Row: { custom_duration: number | null; custom_price: number | null; service_id: string; staff_id: string };
        Insert: { custom_duration?: number | null; custom_price?: number | null; service_id: string; staff_id: string };
        Update: Partial<Database["public"]["Tables"]["service_staff"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: { category_id: string; created_at: string | null; deposit_amount: number | null; deposit_required: boolean | null; description: string | null; duration_minutes: number; id: string; image_url: string | null; is_active: boolean | null; is_featured: boolean | null; max_parallel: number | null; name: string; name_en: string | null; price: number; price_max: number | null; sort_order: number | null; tenant_id: string; updated_at: string | null };
        Insert: { category_id: string; created_at?: string | null; deposit_amount?: number | null; deposit_required?: boolean | null; description?: string | null; duration_minutes?: number; id?: string; image_url?: string | null; is_active?: boolean | null; is_featured?: boolean | null; max_parallel?: number | null; name: string; name_en?: string | null; price?: number; price_max?: number | null; sort_order?: number | null; tenant_id: string; updated_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      staff: {
        Row: { accepts_online_booking: boolean | null; avatar_url: string | null; bio: string | null; booking_buffer_minutes: number | null; color: string | null; created_at: string | null; display_name: string; id: string; is_active: boolean | null; profile_id: string | null; role: Database["public"]["Enums"]["staff_role"] | null; specialties: string[] | null; tenant_id: string; updated_at: string | null };
        Insert: { accepts_online_booking?: boolean | null; avatar_url?: string | null; bio?: string | null; booking_buffer_minutes?: number | null; color?: string | null; created_at?: string | null; display_name: string; id?: string; is_active?: boolean | null; profile_id?: string | null; role?: Database["public"]["Enums"]["staff_role"] | null; specialties?: string[] | null; tenant_id: string; updated_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
      staff_time_off: {
        Row: { created_at: string | null; end_date: string; id: string; reason: string | null; staff_id: string; start_date: string; tenant_id: string };
        Insert: { created_at?: string | null; end_date: string; id?: string; reason?: string | null; staff_id: string; start_date: string; tenant_id: string };
        Update: Partial<Database["public"]["Tables"]["staff_time_off"]["Insert"]>;
        Relationships: [];
      };
      staff_working_hours: {
        Row: { break_end: string | null; break_start: string | null; day_of_week: Database["public"]["Enums"]["day_of_week"]; end_time: string | null; id: string; is_working: boolean | null; staff_id: string; start_time: string | null; tenant_id: string };
        Insert: { break_end?: string | null; break_start?: string | null; day_of_week: Database["public"]["Enums"]["day_of_week"]; end_time?: string | null; id?: string; is_working?: boolean | null; staff_id: string; start_time?: string | null; tenant_id: string };
        Update: Partial<Database["public"]["Tables"]["staff_working_hours"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: { cancel_at: string | null; created_at: string | null; current_period_end: string | null; current_period_start: string | null; id: string; plan: Database["public"]["Enums"]["subscription_plan"] | null; status: Database["public"]["Enums"]["subscription_status"] | null; stripe_customer_id: string | null; stripe_subscription_id: string | null; tenant_id: string; trial_ends_at: string | null; updated_at: string | null };
        Insert: { cancel_at?: string | null; created_at?: string | null; current_period_end?: string | null; current_period_start?: string | null; id?: string; plan?: Database["public"]["Enums"]["subscription_plan"] | null; status?: Database["public"]["Enums"]["subscription_status"] | null; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; tenant_id: string; trial_ends_at?: string | null; updated_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      tenant_content: {
        Row: { created_at: string | null; description: string | null; id: string; image_url: string; is_published: boolean | null; link_url: string | null; published_at: string | null; sort_order: number | null; tenant_id: string; title: string | null; type: Database["public"]["Enums"]["content_type"] };
        Insert: { created_at?: string | null; description?: string | null; id?: string; image_url: string; is_published?: boolean | null; link_url?: string | null; published_at?: string | null; sort_order?: number | null; tenant_id: string; title?: string | null; type: Database["public"]["Enums"]["content_type"] };
        Update: Partial<Database["public"]["Tables"]["tenant_content"]["Insert"]>;
        Relationships: [];
      };
      tenants: {
        Row: { address: string | null; auto_confirm: boolean; booking_advance_days: number | null; cancellation_hours: number | null; city: string | null; country: string | null; cover_url: string | null; created_at: string | null; currency: string | null; description: string | null; email: string | null; google_maps_url: string | null; id: string; instagram_handle: string | null; is_active: boolean | null; locale: string | null; logo_url: string | null; name: string; phone: string | null; primary_color: string | null; reminder_hours: number[] | null; secondary_color: string | null; slot_duration_minutes: number; slug: string; subscription_plan: string; timezone: string | null; updated_at: string | null; website: string | null };
        Insert: { address?: string | null; auto_confirm?: boolean; booking_advance_days?: number | null; cancellation_hours?: number | null; city?: string | null; country?: string | null; cover_url?: string | null; created_at?: string | null; currency?: string | null; description?: string | null; email?: string | null; google_maps_url?: string | null; id?: string; instagram_handle?: string | null; is_active?: boolean | null; locale?: string | null; logo_url?: string | null; name: string; phone?: string | null; primary_color?: string | null; reminder_hours?: number[] | null; secondary_color?: string | null; slot_duration_minutes?: number; slug: string; subscription_plan?: string; timezone?: string | null; updated_at?: string | null; website?: string | null };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_my_role: { Args: Record<string, never>; Returns: Database["public"]["Enums"]["user_role"] };
      get_my_tenant_id: { Args: Record<string, never>; Returns: string };
      is_staff_member: { Args: Record<string, never>; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      is_tenant_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      appointment_status: "pending" | "confirmed" | "in_progress" | "completed" | "canceled" | "no_show";
      booking_source: "online" | "phone" | "walk_in" | "instagram" | "admin";
      content_type: "gallery" | "before_after" | "announcement" | "offer";
      day_of_week: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
      gender_type: "female" | "male" | "other" | "prefer_not_to_say";
      notification_channel: "sms" | "email" | "push" | "whatsapp";
      staff_role: "owner" | "manager" | "technician" | "receptionist";
      subscription_plan: "starter" | "pro" | "enterprise";
      subscription_status: "active" | "trialing" | "past_due" | "canceled" | "paused";
      user_role: "super_admin" | "tenant_admin" | "staff" | "customer";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

/** Row type for a public table, e.g. `Tables<"appointments">`. */
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
/** Insert type for a public table, e.g. `TablesInsert<"customers">`. */
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
/** Update type for a public table. */
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
/** Enum union, e.g. `Enum<"appointment_status">`. */
export type Enum<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

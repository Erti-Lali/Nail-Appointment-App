// ─── Brand ────────────────────────────────────────────────

export const BRAND = {
  name: "NailStudio 101",
  tagline: "Randevunuzu kolayca yönetin",
  colors: {
    gold: "#C9A84C",
    goldLight: "#E8C96A",
    goldDark: "#A07830",
    black: "#0A0A0A",
    blackSoft: "#1A1A1A",
    white: "#FAFAFA",
    gray: "#2A2A2A",
    grayLight: "#3A3A3A",
    error: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
  },
} as const;

// ─── Subscription Plans ───────────────────────────────────

export const PLANS = {
  starter: {
    name: "Starter",
    price_monthly: 299,
    price_yearly: 2990,
    currency: "TRY",
    limits: {
      staff: 3,
      services: 20,
      appointments_per_month: 100,
      sms_per_month: 50,
    },
    features: ["online_booking", "calendar", "customer_management"],
  },
  pro: {
    name: "Pro",
    price_monthly: 599,
    price_yearly: 5990,
    currency: "TRY",
    limits: {
      staff: 10,
      services: 100,
      appointments_per_month: 500,
      sms_per_month: 300,
    },
    features: [
      "online_booking",
      "calendar",
      "customer_management",
      "sms",
      "email",
      "analytics",
      "reviews",
      "content_management",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price_monthly: 1299,
    price_yearly: 12990,
    currency: "TRY",
    limits: {
      staff: -1, // unlimited
      services: -1,
      appointments_per_month: -1,
      sms_per_month: 1000,
    },
    features: [
      "online_booking",
      "calendar",
      "customer_management",
      "sms",
      "email",
      "whatsapp",
      "instagram",
      "analytics",
      "reviews",
      "content_management",
      "ai_assistant",
      "custom_domain",
      "api_access",
    ],
  },
} as const;

// ─── Appointment ──────────────────────────────────────────

export const APPOINTMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Bekliyor", color: "#F59E0B" },
  confirmed: { label: "Onaylandı", color: "#22C55E" },
  in_progress: { label: "Devam Ediyor", color: "#3B82F6" },
  completed: { label: "Tamamlandı", color: "#6B7280" },
  canceled: { label: "İptal Edildi", color: "#EF4444" },
  no_show: { label: "Gelmedi", color: "#EC4899" },
};

// ─── Days ─────────────────────────────────────────────────

export const DAY_LABELS: Record<string, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};

export const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

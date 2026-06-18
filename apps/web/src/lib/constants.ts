import type { Enum } from "@/lib/database.types";

// Single source for user-facing labels & badge styles. Import these instead of
// re-declaring the maps in each component.

export const APPOINTMENT_STATUS: Record<Enum<"appointment_status">, { label: string; badge: string }> = {
  pending:     { label: "Bekliyor",    badge: "bg-amber-100 text-amber-700" },
  confirmed:   { label: "Onaylı",      badge: "bg-green-100 text-green-700" },
  in_progress: { label: "Devam Ediyor", badge: "bg-blue-100 text-blue-700" },
  completed:   { label: "Tamamlandı",  badge: "bg-gray-100 text-gray-600" },
  canceled:    { label: "İptal",       badge: "bg-red-100 text-red-700" },
  no_show:     { label: "Gelmedi",     badge: "bg-pink-100 text-pink-700" },
};

export const USER_ROLE_LABELS: Record<Enum<"user_role">, string> = {
  super_admin: "Süper Admin",
  tenant_admin: "Stüdyo Admini",
  staff: "Personel",
  customer: "Müşteri",
};

export const STAFF_ROLE_LABELS: Record<Enum<"staff_role">, string> = {
  owner: "Sahip",
  manager: "Yönetici",
  technician: "Teknisyen",
  receptionist: "Resepsiyon",
};

export const BOOKED_VIA_LABELS: Record<Enum<"booking_source">, string> = {
  online: "Online",
  phone: "Telefon",
  walk_in: "Yüz Yüze",
  instagram: "Instagram",
  admin: "Panel",
};

// Tenant subscription_plan is free-text in the DB; these are the values the
// platform offers (matching the landing-page pricing).
export const PLANS = ["baslangic", "profesyonel", "isletme"] as const;
export type PlanId = (typeof PLANS)[number];
export const PLAN_LABELS: Record<PlanId, string> = {
  baslangic: "Başlangıç",
  profesyonel: "Profesyonel",
  isletme: "İşletme",
};

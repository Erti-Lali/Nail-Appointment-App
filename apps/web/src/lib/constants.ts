import type { Enum } from "@/lib/database.types";

// Single source for user-facing labels & badge styles. Import these instead of
// re-declaring the maps in each component.

// Badge classes derive from the Aviora status variables (light bg + base text).
export const APPOINTMENT_STATUS: Record<Enum<"appointment_status">, { label: string; badge: string }> = {
  pending:     { label: "Bekliyor",    badge: "bg-[rgb(var(--ns-warning-light))] text-[rgb(var(--ns-warning))]" },
  confirmed:   { label: "Onaylı",      badge: "bg-[rgb(var(--ns-success-light))] text-[rgb(var(--ns-success))]" },
  in_progress: { label: "Devam Ediyor", badge: "bg-[rgb(var(--ns-info-light))] text-[rgb(var(--ns-info))]" },
  completed:   { label: "Tamamlandı",  badge: "bg-[rgb(var(--ns-neutral-light))] text-[rgb(var(--ns-neutral))]" },
  canceled:    { label: "İptal",       badge: "bg-[rgb(var(--ns-danger-light))] text-[rgb(var(--ns-danger))]" },
  no_show:     { label: "Gelmedi",     badge: "bg-[rgb(var(--ns-noshow-light))] text-[rgb(var(--ns-noshow))]" },
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

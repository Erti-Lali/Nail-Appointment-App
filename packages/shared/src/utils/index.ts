import { format, parseISO, addMinutes, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { tr, enUS } from "date-fns/locale";

// ─── Date / Time helpers ───────────────────────────────────

export function formatDate(date: string | Date, fmt = "dd MMMM yyyy", locale = "tr") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: locale === "tr" ? tr : enUS });
}

export function formatTime(date: string | Date, locale = "tr") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: locale === "tr" ? tr : enUS });
}

export function formatDateTime(date: string | Date, locale = "tr") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy, HH:mm", { locale: locale === "tr" ? tr : enUS });
}

export function addDurationToTime(time: string, durationMinutes: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  const result = addMinutes(date, durationMinutes);
  return format(result, "HH:mm");
}

export function isTimeSlotAvailable(
  slotStart: string,
  slotEnd: string,
  appointments: { starts_at: string; ends_at: string }[]
): boolean {
  const start = parseISO(slotStart);
  const end = parseISO(slotEnd);
  return !appointments.some((appt) => {
    const apptStart = parseISO(appt.starts_at);
    const apptEnd = parseISO(appt.ends_at);
    return isBefore(start, apptEnd) && isAfter(end, apptStart);
  });
}

// ─── Price formatters ─────────────────────────────────────

export function formatPrice(amount: number, currency = "TRY", locale = "tr-TR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── String helpers ───────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("90") && clean.length === 12) {
    return `+90 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 10)} ${clean.slice(10)}`;
  }
  if (clean.length === 10) {
    return `0${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8)}`;
  }
  return phone;
}

// ─── Validation ───────────────────────────────────────────

export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, "");
  return clean.length >= 10 && clean.length <= 13;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Duration helpers ─────────────────────────────────────

export function minutesToDisplay(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} sa ${m} dk` : `${h} sa`;
}

// ─── Avatar ───────────────────────────────────────────────

export function getAvatarUrl(avatarUrl: string | null, name: string): string {
  if (avatarUrl) return avatarUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C9A84C&color=0A0A0A&bold=true`;
}

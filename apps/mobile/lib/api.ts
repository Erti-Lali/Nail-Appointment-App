// Calls to the web backend (Vercel / dev server). The service-role-only parts of
// booking (availability + create) live there; mobile reaches them over HTTP.
// EXPO_PUBLIC_API_URL must be reachable from the device (LAN IP in dev, e.g.
// http://192.168.1.x:3010 — localhost won't work on a phone — or the deployed URL).

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function apiConfigured() {
  return !!API_URL;
}

export interface Availability {
  busy: { id?: string; starts_at: string; ends_at: string }[];
  workingHours: { start: string; end: string; breakStart: string | null; breakEnd: string | null } | null;
  onLeave: boolean;
  slotDuration: number;
  autoConfirm: boolean;
}

export async function getAvailability(staffId: string, date: string, tenantId: string): Promise<Availability> {
  if (!API_URL) throw new Error("Uygulama yapılandırması eksik (EXPO_PUBLIC_API_URL).");
  const res = await fetch(`${API_URL}/api/book?staffId=${staffId}&date=${date}&tenantId=${tenantId}`);
  if (!res.ok) throw new Error("Müsaitlik alınamadı");
  return res.json();
}

export interface CreateBookingBody {
  tenantId: string;
  serviceIds: string[];
  staffId: string;
  startsAt: string;
  customer: { firstName: string; lastName: string; phone: string; email?: string };
  notes?: string;
}

export async function createBooking(body: CreateBookingBody): Promise<{ ok: boolean; data: any }> {
  if (!API_URL) return { ok: false, data: { error: "Uygulama yapılandırması eksik (EXPO_PUBLIC_API_URL)." } };
  const res = await fetch(`${API_URL}/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

import { SupabaseClient } from "@supabase/supabase-js";
import { smsConfigured, emailConfigured } from "./notifications";

// Appointment reminder scheduling + message templates.
// Shared by the public booking POST and the admin "new appointment" flow.

const DEFAULT_REMINDER_HOURS = [24, 2];
const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

// Appointment times are stored as wall-clock labeled UTC (the digits the user
// picked). Read them back via UTC components so the displayed date/time matches
// what was booked, regardless of server timezone. Mirrors lib/datetime wallTime.
function toUtcDate(startsAt: string): Date {
  const hasTz = startsAt.endsWith("Z") || /[+-]\d\d:?\d\d$/.test(startsAt);
  return new Date(hasTz ? startsAt : `${startsAt}Z`);
}

export function formatWall(startsAt: string): { date: string; time: string } {
  const d = toUtcDate(startsAt);
  const date = `${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return { date, time };
}

export interface ScheduleReminderOpts {
  appointmentId: string;
  tenantId: string;
  startsAt: string;
  reminderHours?: number[] | null;
  phone?: string | null;
  email?: string | null;
}

// Inserts one reminder row per (reminder hour × configured channel the customer
// can receive). Returns how many rows were created. Idempotent: a UNIQUE
// (appointment_id, channel, scheduled_at) constraint + ignoreDuplicates means
// calling twice for the same appointment won't double-schedule.
export async function scheduleAppointmentReminders(
  admin: SupabaseClient,
  opts: ScheduleReminderOpts,
): Promise<number> {
  const hours = opts.reminderHours && opts.reminderHours.length ? opts.reminderHours : DEFAULT_REMINDER_HOURS;
  const sms = smsConfigured() && !!opts.phone;
  const email = emailConfigured() && !!opts.email;
  if (!sms && !email) return 0;

  const startMs = toUtcDate(opts.startsAt).getTime();
  const rows: {
    appointment_id: string; tenant_id: string; channel: string; scheduled_at: string;
  }[] = [];

  for (const h of hours) {
    const scheduled_at = new Date(startMs - h * 3_600_000).toISOString();
    if (sms) rows.push({ appointment_id: opts.appointmentId, tenant_id: opts.tenantId, channel: "sms", scheduled_at });
    if (email) rows.push({ appointment_id: opts.appointmentId, tenant_id: opts.tenantId, channel: "email", scheduled_at });
  }
  if (!rows.length) return 0;

  const { error } = await admin
    .from("appointment_reminders")
    .upsert(rows, { onConflict: "appointment_id,channel,scheduled_at", ignoreDuplicates: true });
  if (error) return 0;
  return rows.length;
}

// ─── Message templates (TR) ───────────────────────────────
export function reminderSms(firstName: string, startsAt: string, studioName: string): string {
  const { date, time } = formatWall(startsAt);
  return `Merhaba ${firstName || "değerli müşterimiz"}, ${date} tarihinde saat ${time}'deki randevunuzu hatırlatmak isteriz. ${studioName}`;
}

export function reminderEmail(
  firstName: string,
  startsAt: string,
  studioName: string,
  extra?: { staffName?: string | null; services?: string | null },
): { subject: string; html: string } {
  const { date, time } = formatWall(startsAt);
  const subject = `Randevu Hatırlatması — ${studioName}`;
  const rows = [
    ["Tarih", date],
    ["Saat", time],
    ...(extra?.services ? [["Hizmet", extra.services]] : []),
    ...(extra?.staffName ? [["Personel", extra.staffName]] : []),
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#9B6E7A;font-size:13px">${label}</td>` +
        `<td style="padding:6px 0;color:#2D0A1A;font-size:13px;font-weight:600;text-align:right">${value}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#FAF3F0;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:24px">
    <div style="background:#FFFFFF;border:1px solid #F0DDE5;border-radius:16px;overflow:hidden">
      <div style="background:#C4356A;padding:20px 24px">
        <h1 style="margin:0;color:#FFFFFF;font-size:18px">Randevu Hatırlatması</h1>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 16px;color:#2D0A1A;font-size:15px">Merhaba ${firstName || "değerli müşterimiz"},</p>
        <p style="margin:0 0 16px;color:#6B3050;font-size:14px;line-height:1.6">
          <strong>${studioName}</strong> randevunuzu hatırlatmak isteriz. Sizi bekliyoruz! 💅
        </p>
        <table style="width:100%;border-collapse:collapse;background:#FDF0F4;border-radius:12px;padding:8px">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
    <p style="text-align:center;color:#9B6E7A;font-size:11px;margin-top:16px">${studioName}</p>
  </div></body></html>`;

  return { subject, html };
}

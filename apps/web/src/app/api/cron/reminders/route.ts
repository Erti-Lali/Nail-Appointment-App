import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendSms, sendEmail } from "@/lib/notifications";
import { reminderSms, reminderEmail } from "@/lib/reminders";

// Cron worker: sends due appointment reminders.
// Vercel Cron calls this on a schedule with `Authorization: Bearer <CRON_SECRET>`.
// Picks up to 50 pending rows whose scheduled_at has passed and dispatches them.

export const dynamic = "force-dynamic";

const BATCH = 50;

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET ayarlı değil" }, { status: 500 });
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from("appointment_reminders")
    .select(
      "id, channel, appointment:appointments(status, starts_at, " +
      "customer:customers(first_name, phone, email), staff:staff(display_name), " +
      "service:services(name), tenant:tenants(name))",
    )
    .lte("scheduled_at", nowIso)
    .is("sent_at", null)
    .is("failed_at", null)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const markSent = (id: string) => admin.from("appointment_reminders").update({ sent_at: new Date().toISOString() }).eq("id", id);
  const markFailed = (id: string, reason: string) =>
    admin.from("appointment_reminders").update({ failed_at: new Date().toISOString(), error: reason.slice(0, 500) }).eq("id", id);

  let sent = 0, failed = 0, skipped = 0;

  for (const r of (due ?? []) as any[]) {
    const a = r.appointment;
    if (!a) { await markFailed(r.id, "Randevu bulunamadı"); failed++; continue; }

    // Skip canceled / no-show appointments (dequeue so they aren't retried).
    if (a.status === "canceled" || a.status === "no_show") {
      await markFailed(r.id, `Atlandı: randevu durumu ${a.status}`);
      skipped++;
      continue;
    }

    const cust = a.customer;
    const studioName = a.tenant?.name ?? "Stüdyo";
    const firstName = cust?.first_name ?? "";

    let result: { ok: boolean; reason?: string };
    if (r.channel === "sms") {
      if (!cust?.phone) { await markFailed(r.id, "Müşteri telefonu yok"); failed++; continue; }
      result = await sendSms(cust.phone, reminderSms(firstName, a.starts_at, studioName));
    } else if (r.channel === "email") {
      if (!cust?.email) { await markFailed(r.id, "Müşteri e-postası yok"); failed++; continue; }
      const { subject, html } = reminderEmail(firstName, a.starts_at, studioName, {
        staffName: a.staff?.display_name, services: a.service?.name,
      });
      result = await sendEmail(cust.email, subject, html);
    } else {
      await markFailed(r.id, `Desteklenmeyen kanal: ${r.channel}`); failed++; continue;
    }

    if (result.ok) { await markSent(r.id); sent++; }
    else { await markFailed(r.id, result.reason ?? "Gönderilemedi"); failed++; }
  }

  return NextResponse.json({ processed: (due ?? []).length, sent, failed, skipped });
}

export const GET = handle;
export const POST = handle;

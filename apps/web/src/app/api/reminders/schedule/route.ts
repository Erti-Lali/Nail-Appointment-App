import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { scheduleAppointmentReminders } from "@/lib/reminders";

// Schedule reminders for an appointment created from the admin panel.
// The admin "new appointment" modal inserts the appointment client-side, then
// calls this (staff-authed) endpoint, which schedules via the service role
// (appointment_reminders is service-role-only).

const STAFF_ROLES = ["super_admin", "tenant_admin", "staff"];

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles").select("tenant_id, role").eq("id", user.id).single();
  if (!profile?.tenant_id || !STAFF_ROLES.includes(profile.role ?? "")) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  let body: { appointmentId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }
  if (!body.appointmentId) return NextResponse.json({ error: "appointmentId gerekli" }, { status: 400 });

  const { data: appt } = await admin
    .from("appointments")
    .select("id, tenant_id, starts_at, status, customer:customers(phone, email)")
    .eq("id", body.appointmentId)
    .single();

  // Only the appointment's own studio staff may schedule for it.
  if (!appt || appt.tenant_id !== profile.tenant_id) {
    return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  }
  if (appt.status === "canceled" || appt.status === "no_show") {
    return NextResponse.json({ success: true, scheduled: 0 });
  }

  const { data: tenant } = await admin
    .from("tenants").select("reminder_hours").eq("id", appt.tenant_id).single();
  const customer = appt.customer as unknown as { phone?: string | null; email?: string | null } | null;

  const scheduled = await scheduleAppointmentReminders(admin, {
    appointmentId: appt.id,
    tenantId: appt.tenant_id,
    startsAt: appt.starts_at,
    reminderHours: tenant?.reminder_hours,
    phone: customer?.phone,
    email: customer?.email,
  });

  return NextResponse.json({ success: true, scheduled });
}

import { NextRequest, NextResponse } from "next/server";
import { addMinutes, format, parseISO, isBefore } from "date-fns";
import { customerAdmin, getCustomer, customerIdsFor, normPhone } from "@/lib/customer-auth";

// Move a customer's own appointment to a new start time, respecting the
// cancellation window and verifying the new slot is free for the same staff.
export async function POST(req: NextRequest) {
  const admin = customerAdmin();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const ctx = await getCustomer(req, admin);
  if (!ctx) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { appointmentId?: string; newStartsAt?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }
  const { appointmentId, newStartsAt } = body;
  if (!appointmentId || !newStartsAt) {
    return NextResponse.json({ error: "appointmentId ve newStartsAt gerekli" }, { status: 400 });
  }

  const ids = await customerIdsFor(admin, ctx.userId, normPhone(ctx.profile?.phone));
  if (ids.length === 0) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });

  const { data: appt } = await admin
    .from("appointments")
    .select("id, starts_at, status, customer_id, tenant_id, staff_id, duration_minutes")
    .eq("id", appointmentId)
    .single();

  if (!appt || !ids.includes(appt.customer_id)) {
    return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  }
  if (appt.status === "canceled" || appt.status === "completed" || appt.status === "in_progress") {
    return NextResponse.json({ error: "Bu randevu değiştirilemez" }, { status: 400 });
  }

  // Same cancellation window applies to the CURRENT start time.
  const { data: tenant } = await admin
    .from("tenants").select("cancellation_hours").eq("id", appt.tenant_id).single();
  const cancellationHours = tenant?.cancellation_hours ?? 24;
  const hoursUntilCurrent = (new Date(appt.starts_at).getTime() - Date.now()) / 3_600_000;
  if (hoursUntilCurrent < cancellationHours) {
    return NextResponse.json(
      { error: `Değişiklik süresi geçmiş. Randevular en geç ${cancellationHours} saat öncesine kadar değiştirilebilir.` },
      { status: 422 },
    );
  }

  const start = parseISO(newStartsAt);
  if (isNaN(start.getTime())) return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  if (isBefore(start, new Date())) {
    return NextResponse.json({ error: "Geçmiş bir saate randevu alınamaz" }, { status: 400 });
  }

  const duration = appt.duration_minutes ?? 60;
  const end = addMinutes(start, duration);
  const endsAt = format(end, "yyyy-MM-dd'T'HH:mm:ss");
  const date = newStartsAt.slice(0, 10);

  // Busy ranges for the same staff on the new date (excluding this appointment).
  const { data: busy } = await admin
    .from("appointments")
    .select("id, starts_at, ends_at")
    .eq("staff_id", appt.staff_id)
    .gte("starts_at", `${date}T00:00:00`)
    .lte("starts_at", `${date}T23:59:59`)
    .not("status", "in", "(canceled,no_show)");

  const conflict = (busy ?? []).some((b: { id: string; starts_at: string; ends_at: string }) => {
    if (b.id === appointmentId) return false;
    const bs = parseISO(b.starts_at);
    const be = parseISO(b.ends_at);
    return isBefore(start, be) && isBefore(bs, end);
  });
  if (conflict) {
    return NextResponse.json({ error: "Bu saat dolu. Lütfen başka bir saat seçin." }, { status: 409 });
  }

  const { error } = await admin
    .from("appointments")
    .update({ starts_at: newStartsAt, ends_at: endsAt, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) {
    if (error.code === "23P01" || error.message?.includes("exclu")) {
      return NextResponse.json({ error: "Bu saat dolu. Lütfen başka bir saat seçin." }, { status: 409 });
    }
    return NextResponse.json({ error: "Randevu güncellenemedi" }, { status: 500 });
  }
  return NextResponse.json({ success: true, startsAt: newStartsAt, endsAt });
}

import { NextRequest, NextResponse } from "next/server";
import { customerAdmin, getCustomer, customerIdsFor, normPhone } from "@/lib/customer-auth";

// Cancel a customer's own appointment, respecting the studio's cancellation window.
export async function POST(req: NextRequest) {
  const admin = customerAdmin();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const ctx = await getCustomer(req, admin);
  if (!ctx) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { appointmentId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }
  const { appointmentId } = body;
  if (!appointmentId) return NextResponse.json({ error: "appointmentId gerekli" }, { status: 400 });

  const ids = await customerIdsFor(admin, ctx.userId, normPhone(ctx.profile?.phone));
  if (ids.length === 0) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });

  const { data: appt } = await admin
    .from("appointments")
    .select("id, starts_at, status, customer_id, tenant_id")
    .eq("id", appointmentId)
    .single();

  if (!appt || !ids.includes(appt.customer_id)) {
    return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  }
  if (appt.status === "canceled") {
    return NextResponse.json({ error: "Randevu zaten iptal edilmiş" }, { status: 400 });
  }
  if (appt.status === "completed" || appt.status === "in_progress") {
    return NextResponse.json({ error: "Bu randevu iptal edilemez" }, { status: 400 });
  }

  // Cancellation window from the tenant (default 24h).
  const { data: tenant } = await admin
    .from("tenants").select("cancellation_hours").eq("id", appt.tenant_id).single();
  const cancellationHours = tenant?.cancellation_hours ?? 24;

  const hoursUntil = (new Date(appt.starts_at).getTime() - Date.now()) / 3_600_000;
  if (hoursUntil < cancellationHours) {
    return NextResponse.json(
      { error: `İptal süresi geçmiş. Randevular en geç ${cancellationHours} saat öncesine kadar iptal edilebilir.` },
      { status: 422 },
    );
  }

  const { error } = await admin
    .from("appointments")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      canceled_by: ctx.userId,
      cancellation_reason: "Müşteri tarafından iptal edildi",
    })
    .eq("id", appointmentId);

  if (error) return NextResponse.json({ error: "İptal edilemedi" }, { status: 500 });
  return NextResponse.json({ success: true });
}

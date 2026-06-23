import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { addMinutes, format } from "date-fns";

// Public online booking endpoint.
// Anonymous visitors can't insert customers/appointments directly (RLS blocks it),
// so we use the service role key server-side to find-or-create the customer and
// create the appointment. Requires SUPABASE_SERVICE_ROLE_KEY in env.

interface BookingBody {
  tenantId: string;
  serviceIds: string[];
  staffId: string;
  startsAt: string; // "yyyy-MM-ddTHH:mm:ss"
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  notes?: string;
}

// Returns taken time ranges for a staff member on a given date so the public
// booking UI can disable busy slots (anonymous users can't read appointments via RLS).
export async function GET(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ busy: [], slotDuration: 30, autoConfirm: false });
  }
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");
  const date = searchParams.get("date"); // yyyy-MM-dd
  const tenantId = searchParams.get("tenantId"); // optional — for slot duration / auto-confirm
  if (!staffId || !date) {
    return NextResponse.json({ error: "staffId ve date gerekli" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  const DOW = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  // Parse date as a plain Y-M-D so the weekday isn't shifted by server timezone.
  const [y, m, d] = date.split("-").map(Number);
  const dayKey = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

  const [busyRes, hoursRes, offRes, tenantRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("starts_at, ends_at")
      .eq("staff_id", staffId)
      .gte("starts_at", `${date}T00:00:00`)
      .lte("starts_at", `${date}T23:59:59`)
      .not("status", "in", "(canceled,no_show)"),
    supabase
      .from("staff_working_hours")
      .select("is_working, start_time, end_time, break_start, break_end")
      .eq("staff_id", staffId)
      .eq("day_of_week", dayKey)
      .maybeSingle(),
    supabase
      .from("staff_time_off")
      .select("id")
      .eq("staff_id", staffId)
      .lte("start_date", date)
      .gte("end_date", date)
      .limit(1),
    // Tenant slot settings — defaults apply when tenantId is missing/not found.
    tenantId
      ? supabase.from("tenants").select("slot_duration_minutes, auto_confirm").eq("id", tenantId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const wh = hoursRes.data;
  const onLeave = (offRes.data?.length ?? 0) > 0;
  // Working window: null when staff is off that day or on leave.
  const workingHours =
    onLeave || !wh || wh.is_working === false || !wh.start_time || !wh.end_time
      ? null
      : {
          start: wh.start_time.slice(0, 5),
          end: wh.end_time.slice(0, 5),
          breakStart: wh.break_start ? wh.break_start.slice(0, 5) : null,
          breakEnd: wh.break_end ? wh.break_end.slice(0, 5) : null,
        };

  const tenant = tenantRes.data as { slot_duration_minutes?: number; auto_confirm?: boolean } | null;
  const slotDuration = tenant?.slot_duration_minutes ?? 30;
  const autoConfirm = tenant?.auto_confirm ?? false;

  return NextResponse.json({ busy: busyRes.data ?? [], workingHours, onLeave, slotDuration, autoConfirm });
}

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 }
    );
  }

  let body: BookingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { tenantId, serviceIds, staffId, startsAt, customer, notes } = body;
  if (!tenantId || !serviceIds?.length || !staffId || !startsAt || !customer?.phone || !customer?.firstName) {
    return NextResponse.json({ error: "Eksik alanlar" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  // Validate all services belong to tenant + are active
  const { data: svcRows, error: svcErr } = await supabase
    .from("services")
    .select("id, duration_minutes, price, is_active, tenant_id")
    .in("id", serviceIds)
    .eq("tenant_id", tenantId);

  if (
    svcErr ||
    !svcRows ||
    svcRows.length !== serviceIds.length ||
    svcRows.some((s) => !s.is_active)
  ) {
    return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
  }

  const duration =
    svcRows.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) || 60;
  const price = svcRows.reduce((sum, s) => sum + Number(s.price ?? 0), 0);
  const endsAt = format(addMinutes(new Date(startsAt), duration), "yyyy-MM-dd'T'HH:mm:ss");

  // Auto-confirm: when the studio enabled it, the appointment is created already
  // confirmed instead of pending.
  const { data: tenantRow } = await supabase
    .from("tenants").select("auto_confirm").eq("id", tenantId).maybeSingle();
  const status = tenantRow?.auto_confirm === true ? "confirmed" : "pending";

  // Normalize phone for find-or-create
  const phone = customer.phone.replace(/\s+/g, "");

  // Find existing customer by (tenant_id, phone) — unique constraint
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .maybeSingle();

  let customerId = existing?.id as string | undefined;

  if (!customerId) {
    const { data: created, error: custErr } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        first_name: customer.firstName.trim(),
        last_name: (customer.lastName ?? "").trim(),
        phone,
        email: customer.email?.trim() || null,
      })
      .select("id")
      .single();

    if (custErr || !created) {
      return NextResponse.json({ error: "Müşteri oluşturulamadı" }, { status: 500 });
    }
    customerId = created.id;
  }

  // Create appointment (confirmed when the studio auto-confirms, else pending)
  const { data: appointment, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      tenant_id: tenantId,
      customer_id: customerId,
      staff_id: staffId,
      service_id: serviceIds[0], // primary service (NOT NULL)
      starts_at: startsAt,
      ends_at: endsAt,
      duration_minutes: duration,
      price,
      final_price: price,
      discount_amount: 0,
      deposit_paid: 0,
      status,
      booked_via: "online",
      customer_notes: notes?.trim() || null,
    })
    .select("id, starts_at")
    .single();

  if (apptErr) {
    // Exclusion constraint => slot already taken
    if (apptErr.code === "23P01" || apptErr.message?.includes("exclu")) {
      return NextResponse.json(
        { error: "Bu saat az önce doldu. Lütfen başka bir saat seçin." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Randevu oluşturulamadı" }, { status: 500 });
  }

  // Record every selected service in the junction table
  const asRows = svcRows.map((s) => ({
    appointment_id: appointment.id,
    service_id: s.id,
    tenant_id: tenantId,
    price: Number(s.price ?? 0),
    duration_minutes: s.duration_minutes ?? 0,
  }));
  await supabase.from("appointment_services").insert(asRows);

  return NextResponse.json({ success: true, appointmentId: appointment.id, status });
}

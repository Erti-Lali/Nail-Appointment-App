import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Studio onboarding: a freshly-registered owner creates their studio (tenant),
// which gets linked to their profile. Verifies the caller's token, then writes
// with the service role.

const SLOT_DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

function slugify(raw: string): string {
  return raw
    .trim().toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } });

  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const phone = (body.phone ?? "").replace(/\s+/g, "");
  const studioName = (body.studioName ?? "").trim();
  if (!firstName || !phone || !studioName) {
    return NextResponse.json({ error: "Ad, telefon ve stüdyo adı zorunlu" }, { status: 400 });
  }

  // Don't let a user with a studio create another one here.
  const { data: profile } = await admin.from("profiles").select("tenant_id, role").eq("id", user.id).single();
  if (profile?.tenant_id) return NextResponse.json({ error: "Zaten bir stüdyonuz var" }, { status: 409 });

  // Appointment settings
  const s = body.settings ?? {};
  const slot = SLOT_DURATIONS.includes(Number(s.slotDuration)) ? Number(s.slotDuration) : 30;
  const autoConfirm = !!s.autoConfirm;
  const cancellationHours = Number.isFinite(Number(s.cancellationHours)) ? Number(s.cancellationHours) : 24;
  const bookingAdvanceDays = Number.isFinite(Number(s.bookingAdvanceDays)) ? Number(s.bookingAdvanceDays) : 30;
  const reminderHours = Array.isArray(s.reminderHours)
    ? s.reminderHours.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n > 0)
    : [24, 2];

  // Unique slug (append -2, -3… on collision)
  const base = slugify(body.slug || studioName) || "studyo";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { data: clash } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const { data: tenant, error: tErr } = await admin
    .from("tenants")
    .insert({
      name: studioName,
      slug,
      description: (body.description ?? "").trim() || null,
      subscription_plan: "baslangic",
      currency: "TRY",
      country: "TR",
      is_active: true,
      slot_duration_minutes: slot,
      auto_confirm: autoConfirm,
      cancellation_hours: cancellationHours,
      booking_advance_days: bookingAdvanceDays,
      reminder_hours: reminderHours,
    })
    .select("id, name, slug")
    .single();
  if (tErr || !tenant) return NextResponse.json({ error: tErr?.message ?? "Stüdyo oluşturulamadı" }, { status: 500 });

  // Link the profile to the new tenant (preserve super_admin; else ensure tenant_admin).
  await admin.from("profiles").update({
    first_name: firstName,
    last_name: lastName,
    phone,
    tenant_id: tenant.id,
    role: profile?.role === "super_admin" ? "super_admin" : "tenant_admin",
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  // Optional services → need a category first (services.category_id is NOT NULL).
  const services = Array.isArray(body.services)
    ? body.services.filter((x: any) => (x?.name ?? "").trim())
    : [];
  if (services.length) {
    const { data: cat } = await admin
      .from("service_categories")
      .insert({ tenant_id: tenant.id, name: "Hizmetler", sort_order: 0, is_active: true })
      .select("id").single();
    if (cat) {
      await admin.from("services").insert(
        services.map((x: any, i: number) => ({
          tenant_id: tenant.id,
          category_id: cat.id,
          name: String(x.name).trim(),
          duration_minutes: Number(x.duration) > 0 ? Number(x.duration) : 60,
          price: Number(x.price) >= 0 ? Number(x.price) : 0,
          is_active: true,
          sort_order: i,
        })),
      );
    }
  }

  return NextResponse.json({ success: true, tenant });
}

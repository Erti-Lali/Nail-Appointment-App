import { NextRequest, NextResponse } from "next/server";
import { customerAdmin, getCustomer } from "@/lib/customer-auth";

// Customer favorites — studios and services. The client always goes through this
// service-role route (after token verification) for consistency with the rest of
// the customer panel.

export async function GET(req: NextRequest) {
  const admin = customerAdmin();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const ctx = await getCustomer(req, admin);
  if (!ctx) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: favs } = await admin
    .from("customer_favorites")
    .select("id, type, tenant_id, service_id, created_at")
    .eq("profile_id", ctx.userId)
    .order("created_at", { ascending: false });

  const rows = favs ?? [];
  const tenantIds = [...new Set(rows.filter((f: any) => f.type === "studio" && f.tenant_id).map((f: any) => f.tenant_id))];
  const serviceIds = [...new Set(rows.filter((f: any) => f.type === "service" && f.service_id).map((f: any) => f.service_id))];

  const [tenantsRes, servicesRes] = await Promise.all([
    tenantIds.length
      ? admin.from("tenants").select("id, name, city, slug, logo_url").in("id", tenantIds)
      : Promise.resolve({ data: [] as any[] }),
    serviceIds.length
      ? admin.from("services").select("id, name, duration_minutes, price, tenant:tenants(name, slug, city)").in("id", serviceIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const tenantById = new Map((tenantsRes.data ?? []).map((t: any) => [t.id, t]));
  const serviceById = new Map((servicesRes.data ?? []).map((s: any) => [s.id, s]));

  const favorites = rows
    .map((f: any) => {
      if (f.type === "studio") {
        const t = tenantById.get(f.tenant_id);
        if (!t) return null;
        return { id: f.id, type: "studio", studio: t };
      }
      const s = serviceById.get(f.service_id);
      if (!s) return null;
      return { id: f.id, type: "service", service: s };
    })
    .filter(Boolean);

  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const admin = customerAdmin();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const ctx = await getCustomer(req, admin);
  if (!ctx) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { type?: string; tenantId?: string; serviceId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const type = body.type;
  if (type !== "studio" && type !== "service") {
    return NextResponse.json({ error: "Geçersiz tür" }, { status: 400 });
  }

  let tenantId: string | null = null;
  let serviceId: string | null = null;

  if (type === "studio") {
    if (!body.tenantId) return NextResponse.json({ error: "tenantId gerekli" }, { status: 400 });
    tenantId = body.tenantId;
  } else {
    if (!body.serviceId) return NextResponse.json({ error: "serviceId gerekli" }, { status: 400 });
    serviceId = body.serviceId;
    // Derive the service's tenant (for display + the booking link).
    const { data: svc } = await admin.from("services").select("tenant_id").eq("id", serviceId).single();
    if (!svc) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
    tenantId = svc.tenant_id;
  }

  // De-dupe manually: the UNIQUE constraint treats NULLs as distinct, so studio
  // rows (service_id NULL) wouldn't be caught by it.
  const dedupe = admin
    .from("customer_favorites")
    .select("id")
    .eq("profile_id", ctx.userId)
    .eq("type", type)
    .eq("tenant_id", tenantId as string);
  const { data: existing } = serviceId
    ? await dedupe.eq("service_id", serviceId).maybeSingle()
    : await dedupe.is("service_id", null).maybeSingle();

  if (existing) return NextResponse.json({ success: true, id: existing.id, already: true });

  const { data: created, error } = await admin
    .from("customer_favorites")
    .insert({ profile_id: ctx.userId, type, tenant_id: tenantId, service_id: serviceId })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Favori eklenemedi" }, { status: 500 });
  return NextResponse.json({ success: true, id: created.id });
}

export async function DELETE(req: NextRequest) {
  const admin = customerAdmin();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const ctx = await getCustomer(req, admin);
  if (!ctx) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { favoriteId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }
  if (!body.favoriteId) return NextResponse.json({ error: "favoriteId gerekli" }, { status: 400 });

  const { error } = await admin
    .from("customer_favorites")
    .delete()
    .eq("id", body.favoriteId)
    .eq("profile_id", ctx.userId);

  if (error) return NextResponse.json({ error: "Favori silinemedi" }, { status: 500 });
  return NextResponse.json({ success: true });
}

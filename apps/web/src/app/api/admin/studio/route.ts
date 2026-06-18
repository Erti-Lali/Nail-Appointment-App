import { NextRequest, NextResponse } from "next/server";
import { adminClient, verifySuperAdmin } from "@/lib/admin-auth";

const PLANS = ["baslangic", "profesyonel", "isletme"];
const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

// ─── Studio detail (drill-down) ───────────────────────────────
export async function GET(req: NextRequest) {
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
  if (!(await verifySuperAdmin(req, admin))) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const { data: tenant } = await admin.from("tenants").select("*").eq("id", id).single();
  if (!tenant) return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });

  const [staffRes, svcRes, custRes, apptRes] = await Promise.all([
    admin.from("staff").select("id, display_name, role, color, is_active").eq("tenant_id", id).order("display_name"),
    admin.from("services").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    admin.from("customers").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    admin.from("appointments")
      .select("id, status, final_price, starts_at, customer:customers(first_name,last_name), service:services(name), staff:staff(display_name)")
      .eq("tenant_id", id).order("starts_at", { ascending: false }).limit(200),
  ]);

  const appts = apptRes.data ?? [];
  const statusBreakdown: Record<string, number> = {};
  let revenue = 0;
  for (const a of appts) {
    statusBreakdown[a.status] = (statusBreakdown[a.status] ?? 0) + 1;
    if (a.status === "completed") revenue += Number(a.final_price ?? 0);
  }

  // last 6 months revenue (completed)
  const now = new Date();
  const monthly: { label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const rev = appts
      .filter((a: any) => a.status === "completed" && String(a.starts_at).slice(0, 7) === key)
      .reduce((s: number, a: any) => s + Number(a.final_price ?? 0), 0);
    monthly.push({ label: MONTHS_TR[d.getMonth()], revenue: rev });
  }

  const recent = appts.slice(0, 8).map((a: any) => ({
    id: a.id,
    starts_at: a.starts_at,
    status: a.status,
    final_price: a.final_price,
    customer_name: a.customer ? `${a.customer.first_name ?? ""} ${a.customer.last_name ?? ""}`.trim() : "—",
    service_name: a.service?.name ?? "—",
    staff_name: a.staff?.display_name ?? "—",
  }));

  return NextResponse.json({
    tenant,
    stats: {
      staff: staffRes.data?.length ?? 0,
      services: svcRes.count ?? 0,
      customers: custRes.count ?? 0,
      appointments: appts.length,
      revenue,
    },
    statusBreakdown,
    monthly,
    staff: staffRes.data ?? [],
    recent,
  });
}

// ─── Create a new studio (+ optional owner account) ───────────
export async function POST(req: NextRequest) {
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
  if (!(await verifySuperAdmin(req, admin))) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const name = (body.name ?? "").trim();
  const slug = (body.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const plan = PLANS.includes(body.plan) ? body.plan : "baslangic";
  if (!name || !slug) return NextResponse.json({ error: "İsim ve slug gerekli" }, { status: 400 });

  // slug unique?
  const { data: existing } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Bu slug zaten kullanılıyor" }, { status: 409 });

  const { data: tenant, error: tErr } = await admin
    .from("tenants")
    .insert({ name, slug, subscription_plan: plan, currency: "TRY", country: "TR", is_active: true })
    .select("id, name, slug")
    .single();
  if (tErr || !tenant) return NextResponse.json({ error: tErr?.message ?? "Stüdyo oluşturulamadı" }, { status: 500 });

  // Optional owner account
  const ownerEmail = (body.ownerEmail ?? "").trim();
  if (ownerEmail) {
    const { data: created, error: uErr } = await admin.auth.admin.createUser({
      email: ownerEmail,
      password: (body.ownerPassword ?? "").trim() || undefined,
      email_confirm: true,
      user_metadata: {
        first_name: (body.ownerFirstName ?? "").trim() || "Stüdyo",
        last_name: (body.ownerLastName ?? "").trim() || "Sahibi",
        role: "tenant_admin",
      },
    });
    if (uErr || !created?.user) {
      return NextResponse.json(
        { success: true, tenant, ownerWarning: `Stüdyo oluştu ama sahip hesabı oluşturulamadı: ${uErr?.message}` },
      );
    }
    // Trigger created the profile; link it to the tenant.
    await admin.from("profiles").update({ tenant_id: tenant.id, role: "tenant_admin" }).eq("id", created.user.id);
  }

  return NextResponse.json({ success: true, tenant });
}

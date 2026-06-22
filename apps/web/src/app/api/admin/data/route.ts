import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Platform-wide data for the super-admin panel.
// Gated: the caller's JWT must belong to a profile with role = 'super_admin'.
// Uses the service role key (bypasses RLS) only AFTER that check passes.

async function getSuperAdmin(req: NextRequest, admin: SupabaseClient) {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return null;
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "super_admin" ? user : null;
}

export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const user = await getSuperAdmin(req, admin);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const [tenantsRes, apptRes, custRes, profRes, usersRes] = await Promise.all([
    admin.from("tenants").select("id, name, slug, description, is_active, subscription_plan, slot_duration_minutes, auto_confirm, created_at").order("created_at"),
    admin.from("appointments").select("tenant_id, final_price, status"),
    admin.from("customers").select("tenant_id"),
    admin.from("profiles").select("id, role, tenant_id, first_name, last_name"),
    admin.auth.admin.listUsers(),
  ]);

  const tenants = tenantsRes.data ?? [];
  const appts = apptRes.data ?? [];
  const customers = custRes.data ?? [];
  const profiles = profRes.data ?? [];
  const authUsers = usersRes.data?.users ?? [];

  const tenantName: Record<string, string> = {};
  tenants.forEach((t) => { tenantName[t.id] = t.name; });
  const emailById: Record<string, string | undefined> = {};
  authUsers.forEach((u) => { emailById[u.id] = u.email; });

  const apptByTenant: Record<string, number> = {};
  const revByTenant: Record<string, number> = {};
  appts.forEach((a) => {
    apptByTenant[a.tenant_id] = (apptByTenant[a.tenant_id] ?? 0) + 1;
    if (a.status === "completed") {
      revByTenant[a.tenant_id] = (revByTenant[a.tenant_id] ?? 0) + Number(a.final_price ?? 0);
    }
  });
  const custByTenant: Record<string, number> = {};
  customers.forEach((c) => { custByTenant[c.tenant_id] = (custByTenant[c.tenant_id] ?? 0) + 1; });

  const tenantsOut = tenants.map((t) => ({
    ...t,
    appointments: apptByTenant[t.id] ?? 0,
    customers: custByTenant[t.id] ?? 0,
    revenue: revByTenant[t.id] ?? 0,
  }));

  const usersOut = profiles.map((p) => ({
    id: p.id,
    email: emailById[p.id] ?? "—",
    role: p.role,
    name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—",
    tenant_name: p.tenant_id ? (tenantName[p.tenant_id] ?? "—") : "—",
  }));

  const stats = {
    tenants: tenants.length,
    activeTenants: tenants.filter((t) => t.is_active).length,
    users: profiles.length,
    appointments: appts.length,
    revenue: appts
      .filter((a) => a.status === "completed")
      .reduce((s, a) => s + Number(a.final_price ?? 0), 0),
  };

  return NextResponse.json({ stats, tenants: tenantsOut, users: usersOut });
}

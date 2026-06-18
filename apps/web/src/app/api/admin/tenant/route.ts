import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const PLANS = ["baslangic", "profesyonel", "isletme"];

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

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const user = await getSuperAdmin(req, admin);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  let body: { tenantId?: string; subscription_plan?: string; is_active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { tenantId, subscription_plan, is_active } = body;
  if (!tenantId) return NextResponse.json({ error: "tenantId gerekli" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (subscription_plan !== undefined) {
    if (!PLANS.includes(subscription_plan)) {
      return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
    }
    patch.subscription_plan = subscription_plan;
  }
  if (is_active !== undefined) patch.is_active = is_active;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const { error } = await admin.from("tenants").update(patch).eq("id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

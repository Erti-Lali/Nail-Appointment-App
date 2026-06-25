import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const PLANS = ["baslangic", "profesyonel", "isletme"];
const SLOT_DURATIONS = [15, 30, 45, 60];

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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

  let body: {
    tenantId?: string;
    name?: string;
    slug?: string;
    description?: string;
    subscription_plan?: string;
    is_active?: boolean;
    slot_duration_minutes?: number;
    auto_confirm?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { tenantId } = body;
  if (!tenantId) return NextResponse.json({ error: "tenantId gerekli" }, { status: 400 });

  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Stüdyo adı boş olamaz" }, { status: 400 });
    patch.name = name;
  }

  if (body.slug !== undefined) {
    const slug = slugify(body.slug);
    if (!slug) return NextResponse.json({ error: "Geçerli bir slug girin" }, { status: 400 });
    // başka bir stüdyo bu slug'ı kullanıyor mu?
    const { data: clash } = await admin
      .from("tenants").select("id").eq("slug", slug).neq("id", tenantId).maybeSingle();
    if (clash) return NextResponse.json({ error: "Bu slug zaten kullanılıyor" }, { status: 409 });
    patch.slug = slug;
  }

  if (body.description !== undefined) {
    patch.description = body.description.trim() || null;
  }

  if (body.subscription_plan !== undefined) {
    if (!PLANS.includes(body.subscription_plan)) {
      return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
    }
    patch.subscription_plan = body.subscription_plan;
  }

  if (body.is_active !== undefined) patch.is_active = body.is_active;

  if (body.slot_duration_minutes !== undefined) {
    if (!SLOT_DURATIONS.includes(body.slot_duration_minutes)) {
      return NextResponse.json({ error: "Geçersiz slot süresi" }, { status: 400 });
    }
    patch.slot_duration_minutes = body.slot_duration_minutes;
  }

  if (body.auto_confirm !== undefined) patch.auto_confirm = !!body.auto_confirm;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const { data: updated, error } = await admin
    .from("tenants").update(patch).eq("id", tenantId)
    .select("id, name, slug, description, subscription_plan, is_active, slot_duration_minutes, auto_confirm")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, tenant: updated });
}

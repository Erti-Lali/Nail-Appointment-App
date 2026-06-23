import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Direct file upload for /content gallery images.
// Verifies the caller's token, then uploads with the service role to
// tenant-content/{tenantId}/{uuid}-{filename}. The tenant folder is derived from
// the verified user's profile, so a caller can never write into another tenant's
// path (storage RLS in migration 006 is the defense-in-depth backstop).

const BUCKET = "tenant-content";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const STAFF_ROLES = ["super_admin", "tenant_admin", "staff"];

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  // ── Auth ──
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles").select("tenant_id, role").eq("id", user.id).single();
  const tenantId = profile?.tenant_id;
  if (!tenantId || !STAFF_ROLES.includes(profile?.role ?? "")) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  // ── File ──
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Boş dosya" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Dosya 5MB'tan büyük olamaz" }, { status: 413 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Desteklenmeyen dosya türü (JPEG, PNG, WebP, GIF)" }, { status: 415 });
  }

  // ── Upload ──
  const safeName = (file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${tenantId}/${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl, path });
}

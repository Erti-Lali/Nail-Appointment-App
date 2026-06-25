import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Public reference-photo upload for the booking flow (customers are anonymous,
// so this has no auth — unlike /api/upload which is staff-only). Scoped to an
// active tenant and strictly validated. The returned URL is attached to the
// appointment on POST /api/book.

const BUCKET = "tenant-content";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const tenantId = String(form.get("tenantId") ?? "").trim();
  const file = form.get("file");
  if (!tenantId) return NextResponse.json({ error: "tenantId gerekli" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Boş dosya" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Dosya 5MB'tan büyük olamaz" }, { status: 413 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Desteklenmeyen dosya türü" }, { status: 415 });

  // Only allow uploads scoped to a real, active studio.
  const { data: tenant } = await admin.from("tenants").select("id").eq("id", tenantId).eq("is_active", true).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Stüdyo bulunamadı" }, { status: 404 });

  const safeName = (file.name || "photo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `booking/${tenantId}/${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl, path });
}

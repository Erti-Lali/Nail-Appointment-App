import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Register/refresh a mobile device's Expo push token for the logged-in user.
// Verifies the caller's token, then upserts via the service role (push_tokens is
// service-role only). tenant_id is taken from the profile (may be null for
// customers, which is fine — reminders resolve tokens by profile_id).

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const authToken = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!authToken) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { data: { user }, error: authErr } = await admin.auth.getUser(authToken);
  if (authErr || !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { token?: string; platform?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const token = (body.token ?? "").trim();
  const platform = body.platform === "ios" || body.platform === "android" ? body.platform : null;
  if (!token) return NextResponse.json({ error: "token gerekli" }, { status: 400 });

  const { data: profile } = await admin
    .from("profiles").select("tenant_id").eq("id", user.id).single();

  const { error } = await admin
    .from("push_tokens")
    .upsert(
      { profile_id: user.id, tenant_id: profile?.tenant_id ?? null, token, platform },
      { onConflict: "profile_id,token" },
    );

  if (error) return NextResponse.json({ error: "Token kaydedilemedi" }, { status: 500 });
  return NextResponse.json({ success: true });
}

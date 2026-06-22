import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSms, sendEmail, smsConfigured, emailConfigured } from "@/lib/notifications";

interface Body {
  channel: "sms" | "email";
  to: string;
  title?: string;
  message: string;
  tenantId?: string;
  senderId?: string;
}

// Manuel gönderim sonucunu (sent/failed) mevcut `notifications` tablosuna yazar.
// recipient_id NOT NULL (FK→profiles) olduğundan, dış alıcıyı (telefon/e-posta)
// `data` içinde tutup recipient_id'yi gönderen adminin profiline bağlıyoruz.
// Service role key yoksa loglama atlanır (gönderim yine de çalışır).
async function logResult(
  body: Body,
  channel: "sms" | "email",
  ok: boolean,
  reason?: string,
) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !body.tenantId || !body.senderId) return;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { persistSession: false } },
    );
    const now = new Date().toISOString();
    await supabase.from("notifications").insert({
      tenant_id: body.tenantId,
      recipient_id: body.senderId,
      channel,
      type: "manual",
      title: body.title?.trim() || (channel === "sms" ? "SMS" : "E-posta"),
      body: body.message,
      data: { to: body.to, manual: true, ...(reason ? { error: reason } : {}) },
      sent_at: ok ? now : null,
      failed_at: ok ? null : now,
    });
  } catch {
    // Loglama gönderimi bloklamaz
  }
}

export async function POST(request: NextRequest) {
  // Hiçbir kanal yapılandırılmamışsa servis kullanılamaz.
  if (!smsConfigured() && !emailConfigured()) {
    return NextResponse.json(
      { error: "Bildirim kanalı yapılandırılmamış" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { channel, to, title, message } = body;
  if (!channel || !to?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "channel, to ve message gerekli" }, { status: 400 });
  }

  let result;
  if (channel === "sms") {
    result = await sendSms(to, message);
  } else if (channel === "email") {
    const html = `<div style="font-family:sans-serif">${title ? `<h2>${title}</h2>` : ""}<p>${message.replace(/\n/g, "<br/>")}</p></div>`;
    result = await sendEmail(to, title ?? "NailStudio 101", html);
  } else {
    return NextResponse.json({ error: "Desteklenmeyen kanal" }, { status: 400 });
  }

  await logResult(body, channel, result.ok, result.reason);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ success: true, id: result.id });
}

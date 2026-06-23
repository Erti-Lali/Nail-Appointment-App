// Server-side notification senders. Each is gated on the relevant env vars and
// degrades gracefully (returns { ok:false, reason } when not configured) so the
// app keeps working without credentials in development.

export interface SendResult {
  ok: boolean;
  reason?: string;
  id?: string;
}

export function smsConfigured() {
  return !!(process.env.NETGSM_USERNAME && process.env.NETGSM_PASSWORD);
}

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

// ─── Netgsm SMS ───────────────────────────────────────────
export async function sendSms(to: string, message: string): Promise<SendResult> {
  if (!smsConfigured()) {
    return { ok: false, reason: "SMS yapılandırılmamış (NETGSM_USERNAME/PASSWORD)" };
  }
  const phone = to.replace(/\D/g, "");
  const params = new URLSearchParams({
    usercode: process.env.NETGSM_USERNAME!,
    password: process.env.NETGSM_PASSWORD!,
    gsmno: phone,
    message,
    msgheader: process.env.NETGSM_FROM ?? "STUDIO101",
  });

  try {
    const res = await fetch("https://api.netgsm.com.tr/sms/send/get", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const text = (await res.text()).trim();
    // Netgsm returns "00 <jobid>" / "01 <jobid>" on success, numeric error codes otherwise
    const code = text.split(/\s+/)[0];
    if (code === "00" || code === "01" || code === "02") {
      return { ok: true, id: text.split(/\s+/)[1] };
    }
    return { ok: false, reason: `Netgsm hata kodu: ${text}` };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "SMS gönderilemedi" };
  }
}

// ─── Expo Push ────────────────────────────────────────────
// Expo's push API needs no server credentials. On an invalid/expired token Expo
// returns a "DeviceNotRegistered" error — the caller should delete that token.
export async function sendPush(expoPushToken: string, title: string, body: string): Promise<SendResult> {
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: expoPushToken, title, body, sound: "default" }),
    });
    const data = await res.json();
    const ticket = Array.isArray(data?.data) ? data.data[0] : data?.data;
    if (ticket?.status === "ok") return { ok: true, id: ticket.id };
    const reason = ticket?.details?.error ?? ticket?.message ?? data?.errors?.[0]?.message ?? "Push gönderilemedi";
    return { ok: false, reason };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "Push gönderilemedi" };
  }
}

// ─── Resend Email ─────────────────────────────────────────
export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!emailConfigured()) {
    return { ok: false, reason: "E-posta yapılandırılmamış (RESEND_API_KEY)" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "NailStudio 101 <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, reason: data?.message ?? "E-posta gönderilemedi" };
    return { ok: true, id: data?.id };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "E-posta gönderilemedi" };
  }
}

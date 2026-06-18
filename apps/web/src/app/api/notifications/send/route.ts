import { NextRequest, NextResponse } from "next/server";
import { sendSms, sendEmail } from "@/lib/notifications";

interface Body {
  channel: "sms" | "email";
  to: string;
  title?: string;
  message: string;
}

export async function POST(request: NextRequest) {
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

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ success: true, id: result.id });
}

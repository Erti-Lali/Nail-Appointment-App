import { NextRequest, NextResponse } from "next/server";
import { adminClient, verifySuperAdmin } from "@/lib/admin-auth";

const ROLES = ["super_admin", "tenant_admin", "staff", "customer"];

function tempPassword() {
  return Math.random().toString(36).slice(-8) + "A" + Math.floor(Math.random() * 90 + 10) + "!";
}

export async function POST(req: NextRequest) {
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
  const caller = await verifySuperAdmin(req, admin);
  if (!caller) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const { userId, action, role } = body;
  if (!userId || !action) return NextResponse.json({ error: "userId ve action gerekli" }, { status: 400 });

  if (action === "role") {
    if (!ROLES.includes(role)) return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
    if (userId === caller.id) {
      return NextResponse.json({ error: "Kendi rolünüzü değiştiremezsiniz" }, { status: 400 });
    }
    const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "reset_password") {
    const pw = tempPassword();
    const { error } = await admin.auth.admin.updateUserById(userId, { password: pw });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, tempPassword: pw });
  }

  return NextResponse.json({ error: "Bilinmeyen işlem" }, { status: 400 });
}

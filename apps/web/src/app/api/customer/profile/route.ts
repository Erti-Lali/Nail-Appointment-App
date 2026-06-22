import { NextRequest, NextResponse } from "next/server";
import { customerAdmin, getCustomer, normPhone } from "@/lib/customer-auth";

// Read / update the logged-in customer's profile.
// Email + password are changed client-side via the Supabase auth SDK (they need
// re-auth / confirmation flows); this route owns profile fields only and keeps
// the customers table phone in sync.

export async function GET(req: NextRequest) {
  const admin = customerAdmin();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const ctx = await getCustomer(req, admin);
  if (!ctx) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  return NextResponse.json({
    firstName: ctx.profile?.first_name ?? "",
    lastName: ctx.profile?.last_name ?? "",
    phone: ctx.profile?.phone ?? "",
    birthDate: ctx.profile?.birth_date ?? "",
    email: ctx.email ?? "",
  });
}

export async function PUT(req: NextRequest) {
  const admin = customerAdmin();
  if (!admin) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const ctx = await getCustomer(req, admin);
  if (!ctx) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { firstName?: string; lastName?: string; phone?: string; birthDate?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 }); }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const newPhone = normPhone(body.phone);
  const birthDate = (body.birthDate ?? "").trim() || null;

  if (!firstName) return NextResponse.json({ error: "Ad zorunlu" }, { status: 400 });
  if (!newPhone) return NextResponse.json({ error: "Telefon zorunlu" }, { status: 400 });

  const oldPhone = normPhone(ctx.profile?.phone);

  const { error } = await admin
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName, phone: newPhone, birth_date: birthDate, updated_at: new Date().toISOString() })
    .eq("id", ctx.userId);
  if (error) return NextResponse.json({ error: "Profil güncellenemedi" }, { status: 500 });

  // Keep linked customer rows' phone in sync (best effort — a unique clash in one
  // tenant shouldn't block the profile save).
  let phoneSync: "ok" | "partial" = "ok";
  if (newPhone !== oldPhone) {
    const { error: custErr } = await admin
      .from("customers")
      .update({ phone: newPhone })
      .eq("profile_id", ctx.userId);
    if (custErr) phoneSync = "partial";
  }

  return NextResponse.json({ success: true, phoneSync });
}

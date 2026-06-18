import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// "Randevularım" — appointments for the logged-in customer.
// Customers are stored per-tenant and created by phone during public booking.
// We link any customer rows whose phone matches the user's profile phone to
// their profile, then return all appointments across those linked rows.
// Uses service role (after verifying the caller's token) to avoid RLS embed
// complexity for cross-tenant reads.

export async function GET(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("phone, first_name")
    .eq("id", user.id)
    .single();

  const phone = profile?.phone?.replace(/\s+/g, "") ?? null;

  // Link unclaimed customer rows with a matching phone to this profile.
  if (phone) {
    await admin
      .from("customers")
      .update({ profile_id: user.id })
      .is("profile_id", null)
      .eq("phone", phone);
  }

  // Collect this profile's customer ids (linked by profile_id or matching phone).
  const orFilter = phone ? `profile_id.eq.${user.id},phone.eq.${phone}` : `profile_id.eq.${user.id}`;
  const { data: custRows } = await admin.from("customers").select("id").or(orFilter);
  const customerIds = (custRows ?? []).map((c) => c.id);

  if (customerIds.length === 0) {
    return NextResponse.json({ firstName: profile?.first_name ?? "", appointments: [] });
  }

  const { data: appts } = await admin
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, final_price, duration_minutes, " +
      "service:services(name), staff:staff(display_name), tenant:tenants(name, slug), " +
      "appointment_services(service:services(name))"
    )
    .in("customer_id", customerIds)
    .order("starts_at", { ascending: false });

  return NextResponse.json({ firstName: profile?.first_name ?? "", appointments: appts ?? [] });
}

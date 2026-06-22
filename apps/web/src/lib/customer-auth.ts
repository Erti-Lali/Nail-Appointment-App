import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

// Shared helpers for the customer panel APIs (/api/customer/*).
// All these routes verify the caller's JWT first, then use the service role
// to read/write across tenants (customers are per-tenant, RLS-walled).

export function customerAdmin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}

export interface CustomerCtx {
  userId: string;
  email: string | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    birth_date: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getCustomer(req: NextRequest, admin: SupabaseClient): Promise<CustomerCtx | null> {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return null;
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, phone, birth_date, avatar_url")
    .eq("id", user.id)
    .single();
  return { userId: user.id, email: user.email ?? null, profile: profile ?? null };
}

// All customer-row ids belonging to this profile (linked by profile_id or matching phone).
// Also links any unclaimed customer row with a matching phone to this profile.
export async function customerIdsFor(
  admin: SupabaseClient,
  userId: string,
  phone: string | null,
): Promise<string[]> {
  if (phone) {
    await admin.from("customers").update({ profile_id: userId }).is("profile_id", null).eq("phone", phone);
  }
  const orFilter = phone ? `profile_id.eq.${userId},phone.eq.${phone}` : `profile_id.eq.${userId}`;
  const { data } = await admin.from("customers").select("id").or(orFilter);
  return (data ?? []).map((c: { id: string }) => c.id);
}

export const normPhone = (p?: string | null) => (p ?? "").replace(/\s+/g, "");

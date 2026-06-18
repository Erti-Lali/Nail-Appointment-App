import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

// Service-role Supabase client (bypasses RLS). Only use server-side, after
// verifying the caller is a super-admin.
export function adminClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}

// Returns the caller's user object only if their profile role is 'super_admin'.
export async function verifySuperAdmin(req: NextRequest, admin: SupabaseClient) {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return null;
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "super_admin" ? user : null;
}

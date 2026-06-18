import { createClient } from "@supabase/supabase-js";

// ─── Supabase client factory ───────────────────────────────
// Used by both web (Next.js) and mobile (Expo)

export function createSupabaseClient(url: string, anonKey: string) {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // mobile safe
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

// ─── Tenant context helper ─────────────────────────────────
// All queries must be scoped to a tenant_id for security

export function withTenantFilter<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  tenantId: string
): T {
  return query.eq("tenant_id", tenantId);
}

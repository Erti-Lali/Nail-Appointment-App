"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/user-provider";

// Tenant id from the already-loaded UserProvider context. Use inside the
// dashboard (where UserProvider wraps the tree) instead of re-fetching the
// profile/tenant in every page.
export function useTenantId() {
  return useUser().tenantId;
}

// Returns a fetch() wrapper that attaches the current session's access token as
// a Bearer header — for calling our authenticated API routes (e.g. /api/admin/*).
export function useAuthedFetch() {
  return useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers = new Headers(init.headers);
    if (session) headers.set("Authorization", `Bearer ${session.access_token}`);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(input, { ...init, headers });
  }, []);
}

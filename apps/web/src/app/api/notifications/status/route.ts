import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { smsConfigured, emailConfigured } from "@/lib/notifications";

// Channel availability for the notifications page.
// sms/email come from env. push is true when this studio has at least one
// customer who registered a push token (requires the caller's auth token).

export async function GET(req: NextRequest) {
  const status = { sms: smsConfigured(), email: emailConfigured(), push: false };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (serviceKey && token) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });
    const { data: { user } } = await admin.auth.getUser(token);
    if (user) {
      const { data: profile } = await admin.from("profiles").select("tenant_id").eq("id", user.id).single();
      const tenantId = profile?.tenant_id;
      if (tenantId) {
        const { data: custs } = await admin
          .from("customers").select("profile_id").eq("tenant_id", tenantId).not("profile_id", "is", null);
        const profileIds = [...new Set((custs ?? []).map((c) => c.profile_id))] as string[];
        if (profileIds.length) {
          const { count } = await admin
            .from("push_tokens").select("id", { count: "exact", head: true }).in("profile_id", profileIds);
          status.push = (count ?? 0) > 0;
        }
      }
    }
  }

  return NextResponse.json(status);
}

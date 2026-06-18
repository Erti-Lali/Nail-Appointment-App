"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("tenant_id").eq("id", user.id).single();
      const tenantId = profile?.tenant_id;

      const [{ data: history }, statusRes] = await Promise.all([
        supabase.from("notifications").select("*").eq("tenant_id", tenantId)
          .order("created_at", { ascending: false }).limit(50),
        fetch("/api/notifications/status").then((r) => r.json()).catch(() => ({ sms: false, email: false, push: false })),
      ]);

      setData({ tenantId, history: history ?? [], status: statusRes });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#DB5E9B] animate-spin" /></div>;
  }
  return <NotificationsClient {...data} />;
}

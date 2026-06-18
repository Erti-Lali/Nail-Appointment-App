"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { SettingsClient } from "@/components/settings/settings-client";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*, tenants(*)")
        .eq("id", user.id)
        .single();

      let subscription = null;
      if (profile?.tenant_id) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan, status, trial_ends_at, current_period_end")
          .eq("tenant_id", profile.tenant_id)
          .maybeSingle();
        subscription = sub;
      }

      setData({ user, profile, tenant: profile?.tenants ?? null, subscription });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#DB5E9B] animate-spin" /></div>;
  }

  return <SettingsClient {...data} />;
}

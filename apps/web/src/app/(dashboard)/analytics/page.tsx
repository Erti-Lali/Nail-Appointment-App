"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("tenant_id").eq("id", user.id).single();
      setTenantId(profile?.tenant_id ?? null);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-brand animate-spin" /></div>;
  }
  if (!tenantId) {
    return <p className="text-ink-subtle">Stüdyo bağlı değil.</p>;
  }
  return <AnalyticsClient tenantId={tenantId} />;
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsClient, AnalyticsSkeleton } from "@/components/analytics/analytics-client";

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
    return <AnalyticsSkeleton />;
  }
  if (!tenantId) {
    return <p className="text-ink-subtle font-sans">Stüdyo bağlı değil.</p>;
  }
  return <AnalyticsClient tenantId={tenantId} />;
}

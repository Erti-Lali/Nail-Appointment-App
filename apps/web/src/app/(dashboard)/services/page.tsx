"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ServicesClient } from "@/components/services/services-client";
import { Loader2 } from "lucide-react";

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const tenantId = profile?.tenant_id;

      const [{ data: categories }, { data: services }] = await Promise.all([
        supabase.from("service_categories").select("*").eq("tenant_id", tenantId).order("sort_order"),
        supabase.from("services").select("*, category:service_categories(name, color, icon)").eq("tenant_id", tenantId).order("sort_order"),
      ]);

      setPageData({ categories, services, tenantId });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>;

  return (
    <ServicesClient
      categories={pageData.categories ?? []}
      services={pageData.services ?? []}
      tenantId={pageData.tenantId}
    />
  );
}

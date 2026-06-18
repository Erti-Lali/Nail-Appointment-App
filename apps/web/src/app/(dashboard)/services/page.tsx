"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/user-provider";
import { ServicesClient } from "@/components/services/services-client";
import { Spinner } from "@/components/ui";

export default function ServicesPage() {
  const { tenantId, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!tenantId) { setLoading(false); return; }

    async function load() {
      const supabase = createClient();
      const [{ data: categories }, { data: services }] = await Promise.all([
        supabase.from("service_categories").select("*").eq("tenant_id", tenantId).order("sort_order"),
        supabase.from("services").select("*, category:service_categories(name, color, icon)").eq("tenant_id", tenantId).order("sort_order"),
      ]);
      setPageData({ categories, services, tenantId });
      setLoading(false);
    }
    load();
  }, [userLoading, tenantId]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>;

  return (
    <ServicesClient
      categories={pageData?.categories ?? []}
      services={pageData?.services ?? []}
      tenantId={tenantId!}
    />
  );
}

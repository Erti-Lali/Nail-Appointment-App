"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CustomersClient } from "@/components/customers/customers-client";
import { Loader2 } from "lucide-react";

export default function CustomersPage() {
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

      const [
        { data: customers },
        { count: totalCount },
        { count: newThisMonth },
      ] = await Promise.all([
        supabase
          .from("customers")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_blacklisted", false)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      setPageData({ customers, tenantId, totalCount, newThisMonth });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>;

  return (
    <CustomersClient
      customers={pageData.customers ?? []}
      tenantId={pageData.tenantId}
      stats={{ total: pageData.totalCount ?? 0, newThisMonth: pageData.newThisMonth ?? 0 }}
    />
  );
}

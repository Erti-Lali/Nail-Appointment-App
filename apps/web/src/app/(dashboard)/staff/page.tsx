"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StaffClient } from "@/components/staff/staff-client";
import { Loader2 } from "lucide-react";

export default function StaffPage() {
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

      const [{ data: staff }, { data: services }] = await Promise.all([
        supabase
          .from("staff")
          .select(`*, working_hours:staff_working_hours(*), service_staff(service_id)`)
          .eq("tenant_id", tenantId)
          .order("display_name"),
        supabase
          .from("services")
          .select("id, name, duration_minutes, price")
          .eq("tenant_id", tenantId)
          .eq("is_active", true),
      ]);

      setPageData({ staff, services, tenantId });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>;

  return (
    <StaffClient
      staff={pageData.staff ?? []}
      services={pageData.services ?? []}
      tenantId={pageData.tenantId}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/user-provider";
import { StaffClient } from "@/components/staff/staff-client";
import { Spinner } from "@/components/ui";

export default function StaffPage() {
  const { tenantId, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!tenantId) { setLoading(false); return; }

    async function load() {
      const supabase = createClient();
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

      setPageData({ staff, services });
      setLoading(false);
    }
    load();
  }, [userLoading, tenantId]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>;

  return (
    <StaffClient
      staff={pageData?.staff ?? []}
      services={pageData?.services ?? []}
      tenantId={tenantId!}
    />
  );
}

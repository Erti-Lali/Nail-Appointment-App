"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppointmentsClient } from "@/components/appointments/appointments-client";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
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
      const view = searchParams.get("view") ?? "week";
      const dateParam = searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd");
      const weekStart = format(startOfWeek(new Date(dateParam), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(dateParam), { weekStartsOn: 1 }), "yyyy-MM-dd");

      const [
        { data: appointments },
        { data: staff },
        { data: services },
        { data: customers },
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select(`*, customer:customers(id, first_name, last_name, phone), staff:staff(id, display_name, color), service:services(id, name, duration_minutes, price), appointment_services(service_id, service:services(id, name, price, duration_minutes))`)
          .eq("tenant_id", tenantId)
          .gte("starts_at", `${weekStart}T00:00:00`)
          .lte("starts_at", `${weekEnd}T23:59:59`)
          .order("starts_at"),
        supabase.from("staff").select("id, display_name, color, avatar_url").eq("tenant_id", tenantId).eq("is_active", true).order("display_name"),
        supabase.from("services").select("id, name, duration_minutes, price, category_id").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
        supabase.from("customers").select("id, first_name, last_name, phone").eq("tenant_id", tenantId).order("first_name"),
      ]);

      setPageData({ appointments, staff, services, customers, tenantId, view, dateParam });
      setLoading(false);
    }
    load();
  }, [searchParams]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>;

  return (
    <AppointmentsClient
      appointments={pageData.appointments ?? []}
      staff={pageData.staff ?? []}
      services={pageData.services ?? []}
      customers={pageData.customers ?? []}
      tenantId={pageData.tenantId}
      initialView={pageData.view}
      initialDate={pageData.dateParam}
    />
  );
}

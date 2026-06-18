"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CustomerDetailClient } from "@/components/customers/customer-detail-client";
import { Loader2 } from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
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

      const [{ data: customer }, { data: appointments }] = await Promise.all([
        supabase.from("customers").select("*").eq("id", String(params.id)).eq("tenant_id", tenantId).single(),
        supabase
          .from("appointments")
          .select(`*, staff:staff(display_name, color), service:services(name, duration_minutes, price)`)
          .eq("customer_id", params.id as string)
          .eq("tenant_id", tenantId)
          .order("starts_at", { ascending: false })
          .limit(20),
      ]);

      setPageData({ customer, appointments });
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>;
  if (!pageData?.customer) return <div className="text-white/50 text-center p-8">Müşteri bulunamadı.</div>;

  return <CustomerDetailClient customer={pageData.customer} appointments={pageData.appointments ?? []} />;
}

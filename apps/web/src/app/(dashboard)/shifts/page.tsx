"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShiftsClient } from "@/components/shifts/shifts-client";
import { Loader2 } from "lucide-react";

export default function ShiftsPage() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);

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

      const { data } = await supabase
        .from("staff")
        .select(`id, display_name, color, role, is_active, working_hours:staff_working_hours(*)`)
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("display_name");

      setStaff(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return <ShiftsClient staff={staff} />;
}

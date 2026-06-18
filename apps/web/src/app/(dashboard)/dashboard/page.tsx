"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardStats } from "@/components/dashboard/stats";
import { TodayAppointments } from "@/components/dashboard/today-appointments";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentCustomers } from "@/components/dashboard/recent-customers";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    firstName: "",
    tenantId: null as string | null,
    appointmentsToday: 0,
    totalCustomers: 0,
    monthRevenue: 0,
    todayAppointments: [] as any[],
    recentCustomers: [] as any[],
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, first_name")
        .eq("id", user.id)
        .single();

      const tenantId = profile?.tenant_id;
      const today = new Date().toISOString().split("T")[0];

      const [
        { count: appToday },
        { count: custCount },
        { data: todayAppts },
        { data: recentCusts },
        { data: monthRev },
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("starts_at", `${today}T00:00:00`)
          .lte("starts_at", `${today}T23:59:59`),
        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId),
        supabase
          .from("appointments")
          .select(`*, customer:customers(first_name, last_name, phone), staff:staff(display_name, color), service:services(name, duration_minutes, price)`)
          .eq("tenant_id", tenantId)
          .gte("starts_at", `${today}T00:00:00`)
          .lte("starts_at", `${today}T23:59:59`)
          .order("starts_at"),
        supabase
          .from("customers")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("appointments")
          .select("final_price")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("starts_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      setData({
        firstName: profile?.first_name ?? "",
        tenantId,
        appointmentsToday: appToday ?? 0,
        totalCustomers: custCount ?? 0,
        monthRevenue: monthRev?.reduce((sum: number, a: any) => sum + (a.final_price ?? 0), 0) ?? 0,
        todayAppointments: todayAppts ?? [],
        recentCustomers: recentCusts ?? [],
      });
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">
          Günaydın, {data.firstName} ✨
        </h1>
        <p className="text-white/50 mt-1">
          {new Date().toLocaleDateString("tr-TR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <DashboardStats
        appointmentsToday={data.appointmentsToday}
        totalCustomers={data.totalCustomers}
        monthRevenue={data.monthRevenue}
      />

      <QuickActions />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <TodayAppointments appointments={data.todayAppointments} />
          <RevenueChart tenantId={data.tenantId} />
        </div>
        <div>
          <RecentCustomers customers={data.recentCustomers} />
        </div>
      </div>
    </div>
  );
}

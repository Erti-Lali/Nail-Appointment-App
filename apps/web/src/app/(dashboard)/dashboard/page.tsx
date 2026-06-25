"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { DashboardStats } from "@/components/dashboard/stats";
import { TodayAppointments } from "@/components/dashboard/today-appointments";
import { TodayTimeline } from "@/components/dashboard/today-timeline";
import { MiniRevenueChart } from "@/components/dashboard/mini-revenue-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentCustomers } from "@/components/dashboard/recent-customers";
import { Birthdays } from "@/components/dashboard/birthdays";
import { wallTime, wallMinutes } from "@/lib/datetime";
import { useUser } from "@/components/providers/user-provider";
import Link from "next/link";
import { Loader2, Store, ArrowRight } from "lucide-react";

// Saate göre selamlama — sabit "Günaydın" değil.
function greeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Günaydın", emoji: "☕" };
  if (h < 18) return { text: "İyi günler", emoji: "✨" };
  return { text: "İyi akşamlar", emoji: "🌙" };
}

// Hero tezi: günü düz Türkçe ile özetleyen tek cümle (copy = tasarım malzemesi).
function pulseLine(todayAppointments: any[]): string {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const active = todayAppointments.filter(
    (a) => a.status !== "canceled" && a.status !== "no_show"
  );
  if (active.length === 0) return "Bugün için planlanmış randevu yok — sakin bir gün.";
  const next = active.find((a) => wallMinutes(a.starts_at) >= nowMin);
  if (next) {
    const name = `${next.customer?.first_name ?? ""} ${next.customer?.last_name ?? ""}`.trim() || "müşteri";
    return `Bugün ${active.length} randevu · sıradaki ${wallTime(next.starts_at)}, ${name}`;
  }
  return `Bugün ${active.length} randevunun tamamı geride kaldı.`;
}

// Doğum günü "YYYY-MM-DD" değerinden, bugünden itibaren 7 günlük pencereye
// düşenleri seçer; kaç gün kaldığını ve dolduracağı yaşı hesaplar.
function buildBirthdays(customers: any[]) {
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return customers
    .map((c) => {
      const parts = String(c.birth_date).split("-").map(Number);
      const [by, bm, bd] = parts;
      if (!bm || !bd) return null;
      let occ = new Date(now.getFullYear(), bm - 1, bd);
      let diff = Math.round((occ.getTime() - today0.getTime()) / 86400000);
      if (diff < 0) {
        occ = new Date(now.getFullYear() + 1, bm - 1, bd);
        diff = Math.round((occ.getTime() - today0.getTime()) / 86400000);
      }
      if (diff < 0 || diff > 6) return null;
      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        birth_date: c.birth_date,
        daysUntil: diff,
        age: by && by > 1900 ? occ.getFullYear() - by : null,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil);
}

export default function DashboardPage() {
  const { tenantId, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [today] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState({
    firstName: "",
    tenantId: null as string | null,
    appointmentsToday: 0,
    totalCustomers: 0,
    monthRevenue: 0,
    todayAppointments: [] as any[],
    recentCustomers: [] as any[],
    weeklyRevenue: [] as { label: string; revenue: number }[],
    birthdays: [] as any[],
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
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const weekAgo = `${format(subDays(new Date(), 6), "yyyy-MM-dd")}T00:00:00`;

      const [
        { count: appToday },
        { count: custCount },
        { data: todayAppts },
        { data: recentCusts },
        { data: monthRev },
        { data: weekAppts },
        { data: birthdayCusts },
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
          .gte("starts_at", monthStart),
        supabase
          .from("appointments")
          .select("starts_at, final_price")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("starts_at", weekAgo),
        supabase
          .from("customers")
          .select("id, first_name, last_name, phone, birth_date")
          .eq("tenant_id", tenantId)
          .not("birth_date", "is", null),
      ]);

      // Son 7 günün günlük cirosu (eskiden yeniye)
      const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
        const day = subDays(new Date(), 6 - i);
        const key = format(day, "yyyy-MM-dd");
        return {
          label: format(day, "EEE", { locale: tr }),
          revenue: (weekAppts ?? [])
            .filter((a: any) => String(a.starts_at).startsWith(key))
            .reduce((sum: number, a: any) => sum + (a.final_price ?? 0), 0),
        };
      });

      setData({
        firstName: profile?.first_name ?? "",
        tenantId,
        appointmentsToday: appToday ?? 0,
        totalCustomers: custCount ?? 0,
        monthRevenue: monthRev?.reduce((sum: number, a: any) => sum + (a.final_price ?? 0), 0) ?? 0,
        todayAppointments: todayAppts ?? [],
        recentCustomers: recentCusts ?? [],
        weeklyRevenue,
        birthdays: buildBirthdays(birthdayCusts ?? []),
      });
      setLoading(false);
    }
    load();
  }, [today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const g = greeting();
  const longDate = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stüdyo bağlı değilse: bağlama uyarısı */}
      {!userLoading && !tenantId && (
        <Link
          href="/studyo-olustur"
          className="flex items-center gap-4 bg-brand-soft border border-brand/30 rounded-2xl p-4 sm:p-5 hover:border-brand transition-colors group"
        >
          <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-surface" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink">Stüdyonu bağla</p>
            <p className="text-ink-muted text-sm">Randevu almaya başlamak için stüdyonu oluştur — birkaç dakika sürer.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-brand text-surface text-sm font-semibold px-4 py-2 rounded-xl shrink-0 group-hover:bg-brand-dark transition-colors">
            Oluştur <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}

      {/* Hero: selamlama + günün tek cümlelik tezi */}
      <div>
        <p className="text-ink-subtle text-xs uppercase tracking-[0.18em]">{longDate}</p>
        <h1 className="text-3xl font-display font-bold text-ink mt-1">
          {g.text}, {data.firstName} {g.emoji}
        </h1>
        <p className="text-ink-muted mt-1.5">{pulseLine(data.todayAppointments)}</p>
      </div>

      <DashboardStats
        appointmentsToday={data.appointmentsToday}
        monthRevenue={data.monthRevenue}
        totalCustomers={data.totalCustomers}
        birthdaysThisWeek={data.birthdays.length}
      />

      {/* İmza öğesi: günün çizelgesi (canlı "şu an" çizgisi) */}
      <TodayTimeline appointments={data.todayAppointments} today={today} />

      <QuickActions />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <MiniRevenueChart data={data.weeklyRevenue} />
          <TodayAppointments appointments={data.todayAppointments} />
        </div>
        <div className="space-y-6">
          <Birthdays birthdays={data.birthdays} />
          <RecentCustomers customers={data.recentCustomers} />
        </div>
      </div>
    </div>
  );
}

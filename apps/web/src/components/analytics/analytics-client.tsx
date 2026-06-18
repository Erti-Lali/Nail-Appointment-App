"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import {
  startOfMonth, endOfMonth, subMonths, eachDayOfInterval, format, parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { DollarSign, Calendar, Users, TrendingUp, Loader2 } from "lucide-react";
import { formatPrice } from "@nailstudio/shared";

const PINK = "#DB5E9B";
const STATUS_META: Record<string, { label: string; color: string }> = {
  completed: { label: "Tamamlandı", color: "#22C55E" },
  confirmed: { label: "Onaylandı", color: "#DB5E9B" },
  pending: { label: "Bekliyor", color: "#F59E0B" },
  in_progress: { label: "Devam ediyor", color: "#3B82F6" },
  canceled: { label: "İptal", color: "#EF4444" },
  no_show: { label: "Gelmedi", color: "#9CA3AF" },
};

export function AnalyticsClient({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ revenue: 0, appts: 0, customers: 0, completionRate: 0, revenueDelta: 0 });
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [staffPerf, setStaffPerf] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const prevStart = startOfMonth(subMonths(now, 1));

      const { data: appts } = await supabase
        .from("appointments")
        .select("starts_at, status, final_price, service:services(name), staff:staff(display_name, color)")
        .eq("tenant_id", tenantId)
        .gte("starts_at", prevStart.toISOString());

      const { count: customerCount } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const all = appts ?? [];
      const thisMonth = all.filter((a) => parseISO(a.starts_at) >= monthStart && parseISO(a.starts_at) <= monthEnd);
      const prevMonth = all.filter((a) => parseISO(a.starts_at) >= prevStart && parseISO(a.starts_at) < monthStart);

      const revenue = thisMonth.filter((a) => a.status === "completed").reduce((s, a) => s + Number(a.final_price), 0);
      const prevRevenue = prevMonth.filter((a) => a.status === "completed").reduce((s, a) => s + Number(a.final_price), 0);
      const revenueDelta = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
      const completed = thisMonth.filter((a) => a.status === "completed").length;
      const finished = thisMonth.filter((a) => ["completed", "no_show", "canceled"].includes(a.status)).length;
      const completionRate = finished > 0 ? Math.round((completed / finished) * 100) : 0;

      setKpis({
        revenue,
        appts: thisMonth.length,
        customers: customerCount ?? 0,
        completionRate,
        revenueDelta,
      });

      // Revenue trend (this month, daily)
      const days = eachDayOfInterval({ start: monthStart, end: now });
      setRevenueTrend(days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        return {
          date: format(d, "d MMM", { locale: tr }),
          revenue: thisMonth
            .filter((a) => a.status === "completed" && a.starts_at.startsWith(key))
            .reduce((s, a) => s + Number(a.final_price), 0),
        };
      }));

      // Top services (this month, by count)
      const svcMap = new Map<string, number>();
      thisMonth.forEach((a: any) => {
        const name = a.service?.name ?? "Diğer";
        svcMap.set(name, (svcMap.get(name) ?? 0) + 1);
      });
      setTopServices([...svcMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5));

      // Status breakdown
      const statusMap = new Map<string, number>();
      thisMonth.forEach((a) => statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1));
      setStatusData([...statusMap.entries()].map(([status, value]) => ({
        name: STATUS_META[status]?.label ?? status,
        value,
        color: STATUS_META[status]?.color ?? "#9CA3AF",
      })));

      // Staff performance (revenue, this month)
      const staffMap = new Map<string, { name: string; color: string; revenue: number }>();
      thisMonth.filter((a) => a.status === "completed").forEach((a: any) => {
        const name = a.staff?.display_name ?? "Bilinmiyor";
        const prev = staffMap.get(name) ?? { name, color: a.staff?.color ?? PINK, revenue: 0 };
        prev.revenue += Number(a.final_price);
        staffMap.set(name, prev);
      });
      setStaffPerf([...staffMap.values()].sort((a, b) => b.revenue - a.revenue));

      setLoading(false);
    }
    load();
  }, [tenantId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#DB5E9B] animate-spin" /></div>;
  }

  const kpiCards = [
    { icon: DollarSign, label: "Bu Ay Gelir", value: formatPrice(kpis.revenue), change: `${kpis.revenueDelta >= 0 ? "+" : ""}${kpis.revenueDelta}%` },
    { icon: Calendar, label: "Bu Ay Randevu", value: String(kpis.appts), change: null },
    { icon: Users, label: "Toplam Müşteri", value: String(kpis.customers), change: null },
    { icon: TrendingUp, label: "Tamamlanma Oranı", value: `%${kpis.completionRate}`, change: null },
  ];

  const empty = kpis.appts === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-[#1A0A14]">Analitik</h1>
        <p className="text-[#9CA3AF] mt-1">Stüdyonuzun performans verileri (bu ay)</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((stat) => (
          <div key={stat.label} className="card border border-[#F3E0EB]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#DB5E9B]/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-[#DB5E9B]" />
              </div>
              <span className="text-[#9CA3AF] text-sm">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#1A0A14]">{stat.value}</div>
            {stat.change && (
              <div className={`text-xs mt-1 ${kpis.revenueDelta >= 0 ? "text-green-600" : "text-red-500"}`}>
                {stat.change} geçen aya göre
              </div>
            )}
          </div>
        ))}
      </div>

      {empty ? (
        <div className="card border border-[#F3E0EB] flex items-center justify-center h-64">
          <p className="text-[#9CA3AF]">Bu ay için henüz veri yok.</p>
        </div>
      ) : (
        <>
          {/* Revenue trend */}
          <div className="card border border-[#F3E0EB]">
            <h3 className="font-semibold text-[#1A0A14] mb-6">Günlük Ciro</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PINK} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PINK} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3E0EB" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v}`} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke={PINK} strokeWidth={2} fill="url(#pinkGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top services */}
            <div className="card border border-[#F3E0EB]">
              <h3 className="font-semibold text-[#1A0A14] mb-6">En Çok Tercih Edilen Hizmetler</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topServices} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3E0EB" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#6B1A45", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#FFF0F7" }} content={<CountTooltip />} />
                  <Bar dataKey="count" fill={PINK} radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status breakdown */}
            <div className="card border border-[#F3E0EB]">
              <h3 className="font-semibold text-[#1A0A14] mb-6">Randevu Durumları</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CountTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[#6B1A45] flex-1">{d.name}</span>
                      <span className="text-[#1A0A14] font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Staff performance */}
          {staffPerf.length > 0 && (
            <div className="card border border-[#F3E0EB]">
              <h3 className="font-semibold text-[#1A0A14] mb-4">Personel Performansı (Ciro)</h3>
              <div className="space-y-3">
                {staffPerf.map((s) => {
                  const max = staffPerf[0].revenue || 1;
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-[#1A0A14] truncate">{s.name}</div>
                      <div className="flex-1 h-7 bg-[#FEF0F5] rounded-lg overflow-hidden">
                        <div className="h-full rounded-lg flex items-center justify-end px-2"
                          style={{ width: `${Math.max((s.revenue / max) * 100, 8)}%`, backgroundColor: s.color }}>
                          <span className="text-[10px] font-semibold text-white">{formatPrice(s.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-[#FFFFFF] border border-[#F3E0EB] rounded-xl p-3 shadow-lg">
        <p className="text-[#9CA3AF] text-xs mb-1">{label}</p>
        <p className="text-[#DB5E9B] font-semibold">{formatPrice(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

function CountTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    const p = payload[0];
    return (
      <div className="bg-[#FFFFFF] border border-[#F3E0EB] rounded-xl p-2.5 shadow-lg text-sm">
        <span className="text-[#1A0A14] font-medium">{p.payload.name}: </span>
        <span className="text-[#DB5E9B] font-semibold">{p.value}</span>
      </div>
    );
  }
  return null;
}

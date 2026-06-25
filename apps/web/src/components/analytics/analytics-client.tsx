"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import {
  startOfMonth, endOfMonth, subMonths, subDays,
  startOfWeek, endOfWeek, subWeeks, addWeeks, format, parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { DollarSign, Calendar, Users, TrendingUp } from "lucide-react";
import { formatPrice } from "@nailstudio/shared";

// Recharts SVG attribute'larına var() güvenilmez (presentation attribute'lar CSS
// değildir). Bu yüzden temayı tek kaynaktan (nailstudio-theme-variables.css) runtime'da
// okuyup gerçek rgb(...) string'lerine çeviriyoruz — hardcode renk yok.
type ThemeColors = ReturnType<typeof readThemeColors>;
function readThemeColors() {
  const s = getComputedStyle(document.documentElement);
  const c = (name: string) => `rgb(${s.getPropertyValue(name).trim()})`;
  return {
    brand: c("--ns-brand"),
    brandSoft: c("--ns-brand-soft"),
    line: c("--ns-line"),
    inkSubtle: c("--ns-ink-subtle"),
    inkMuted: c("--ns-ink-muted"),
    status: {
      completed: c("--ns-neutral"),
      confirmed: c("--ns-success"),
      pending: c("--ns-warning"),
      in_progress: c("--ns-info"),
      canceled: c("--ns-danger"),
      no_show: c("--ns-noshow"),
    } as Record<string, string>,
  };
}

const STATUS_LABEL: Record<string, string> = {
  completed: "Tamamlandı",
  confirmed: "Onaylandı",
  pending: "Bekliyor",
  in_progress: "Devam ediyor",
  canceled: "İptal",
  no_show: "Gelmedi",
};

type Appt = {
  starts_at: string;
  status: string;
  final_price: number | string | null;
  customer_id: string;
  service: { name: string } | null;
  staff: { display_name: string } | null;
};

export function AnalyticsClient({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const [kpis, setKpis] = useState({
    revenue: 0, revenueDelta: 0,
    appts: 0, apptsDelta: 0,
    activeCustomers: 0,
    completionRate: 0,
  });
  const [revenueTrend, setRevenueTrend] = useState<{ week: string; revenue: number }[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [statusData, setStatusData] = useState<{ key: string; name: string; value: number; color: string }[]>([]);
  const [staffPerf, setStaffPerf] = useState<{ name: string; completed: number; revenue: number }[]>([]);

  useEffect(() => {
    const theme = readThemeColors();
    setColors(theme);

    async function load() {
      const supabase = createClient();
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const prevStart = startOfMonth(subMonths(now, 1));
      const eightWeeksStart = startOfWeek(subWeeks(now, 7), { weekStartsOn: 1 });
      const active30Start = subDays(now, 30);
      // En erken ihtiyaç duyulan tarih: aylık karşılaştırma vs 8-haftalık trend.
      const fetchFrom = prevStart < eightWeeksStart ? prevStart : eightWeeksStart;

      const { data } = await supabase
        .from("appointments")
        .select("starts_at, status, final_price, customer_id, service:services(name), staff:staff(display_name)")
        .eq("tenant_id", tenantId)
        .gte("starts_at", fetchFrom.toISOString());

      const all = (data ?? []) as unknown as Appt[];
      const price = (a: Appt) => Number(a.final_price ?? 0);
      const at = (a: Appt) => parseISO(a.starts_at);

      const thisMonth = all.filter((a) => at(a) >= monthStart && at(a) <= monthEnd);
      const prevMonth = all.filter((a) => at(a) >= prevStart && at(a) < monthStart);

      // ── KPIs ──
      const completedThis = thisMonth.filter((a) => a.status === "completed");
      const revenue = completedThis.reduce((s, a) => s + price(a), 0);
      const prevRevenue = prevMonth
        .filter((a) => a.status === "completed")
        .reduce((s, a) => s + price(a), 0);
      const pct = (cur: number, prev: number) =>
        prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;

      const finished = thisMonth.filter((a) =>
        ["completed", "no_show", "canceled"].includes(a.status)).length;
      const completionRate = finished > 0
        ? Math.round((completedThis.length / finished) * 100) : 0;

      const activeCustomers = new Set(
        all.filter((a) => at(a) >= active30Start).map((a) => a.customer_id)
      ).size;

      setKpis({
        revenue,
        revenueDelta: pct(revenue, prevRevenue),
        appts: thisMonth.length,
        apptsDelta: pct(thisMonth.length, prevMonth.length),
        activeCustomers,
        completionRate,
      });

      // ── Haftalık ciro trendi (son 8 hafta) ──
      const weeks = Array.from({ length: 8 }, (_, i) => {
        const ws = startOfWeek(addWeeks(eightWeeksStart, i), { weekStartsOn: 1 });
        const we = endOfWeek(ws, { weekStartsOn: 1 });
        return {
          week: format(ws, "d MMM", { locale: tr }),
          revenue: all
            .filter((a) => a.status === "completed" && at(a) >= ws && at(a) <= we)
            .reduce((s, a) => s + price(a), 0),
        };
      });
      setRevenueTrend(weeks);

      // ── Top 5 hizmet (bu ay, randevu sayısı) ──
      const svcMap = new Map<string, number>();
      thisMonth.forEach((a) => {
        const name = a.service?.name ?? "Diğer";
        svcMap.set(name, (svcMap.get(name) ?? 0) + 1);
      });
      setTopServices([...svcMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5));

      // ── Durum dağılımı (bu ay) ──
      const statusMap = new Map<string, number>();
      thisMonth.forEach((a) => statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1));
      setStatusData([...statusMap.entries()].map(([key, value]) => ({
        key,
        name: STATUS_LABEL[key] ?? key,
        value,
        color: theme.status[key] ?? theme.inkSubtle,
      })));

      // ── Personel performansı (bu ay): tamamlanan + ciro ──
      const staffMap = new Map<string, { name: string; completed: number; revenue: number }>();
      completedThis.forEach((a) => {
        const name = a.staff?.display_name ?? "Bilinmiyor";
        const prev = staffMap.get(name) ?? { name, completed: 0, revenue: 0 };
        prev.completed += 1;
        prev.revenue += price(a);
        staffMap.set(name, prev);
      });
      setStaffPerf([...staffMap.values()].sort((a, b) => b.revenue - a.revenue));

      setLoading(false);
    }
    load();
  }, [tenantId]);

  if (loading || !colors) return <AnalyticsSkeleton />;

  const kpiCards = [
    { icon: DollarSign, label: "Bu Ay Gelir", value: formatPrice(kpis.revenue), delta: kpis.revenueDelta },
    { icon: Calendar, label: "Bu Ay Randevu", value: String(kpis.appts), delta: kpis.apptsDelta },
    { icon: Users, label: "Aktif Müşteri (30g)", value: String(kpis.activeCustomers), delta: null },
    { icon: TrendingUp, label: "Doluluk Oranı", value: `%${kpis.completionRate}`, delta: null },
  ];

  const empty = kpis.appts === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Analitik</h1>
        <p className="text-ink-subtle font-sans mt-1">Stüdyonuzun performans verileri (bu ay)</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((stat) => (
          <div key={stat.label} className="card border border-line">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-brand" />
              </div>
              <span className="text-ink-subtle font-sans text-sm">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-ink">{stat.value}</div>
            {stat.delta !== null && (
              <div className={`text-xs font-sans mt-1 ${stat.delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                {stat.delta >= 0 ? "+" : ""}{stat.delta}% geçen aya göre
              </div>
            )}
          </div>
        ))}
      </div>

      {empty ? (
        <div className="card border border-line flex items-center justify-center h-64">
          <p className="text-ink-subtle font-sans">Bu ay için henüz veri yok.</p>
        </div>
      ) : null}

      {/* Haftalık ciro trendi (son 8 hafta) */}
      <div className="card border border-line">
        <h3 className="font-display font-semibold text-ink mb-6">Haftalık Ciro (Son 8 Hafta)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.brand} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.line} vertical={false} />
            <XAxis dataKey="week" tick={{ fill: colors.inkSubtle, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: colors.inkSubtle, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v}`} />
            <Tooltip content={<RevenueTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke={colors.brand} strokeWidth={2} fill="url(#brandGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top hizmetler */}
        <div className="card border border-line">
          <h3 className="font-display font-semibold text-ink mb-6">En Çok Tercih Edilen Hizmetler</h3>
          {topServices.length === 0 ? (
            <p className="text-ink-subtle font-sans text-sm h-[240px] flex items-center justify-center">Veri yok.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topServices} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.line} horizontal={false} />
                <XAxis type="number" tick={{ fill: colors.inkSubtle, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: colors.inkMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: colors.brandSoft }} content={<CountTooltip />} />
                <Bar dataKey="count" fill={colors.brand} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Durum dağılımı */}
        <div className="card border border-line">
          <h3 className="font-display font-semibold text-ink mb-6">Randevu Durumları</h3>
          {statusData.length === 0 ? (
            <p className="text-ink-subtle font-sans text-sm h-[200px] flex items-center justify-center">Veri yok.</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {statusData.map((d) => <Cell key={d.key} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CountTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusData.map((d) => (
                  <div key={d.key} className="flex items-center gap-2 font-sans text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-ink-muted flex-1">{d.name}</span>
                    <span className="text-ink font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Personel performansı — tablo */}
      <div className="card border border-line">
        <h3 className="font-display font-semibold text-ink mb-4">Personel Performansı (Bu Ay)</h3>
        {staffPerf.length === 0 ? (
          <p className="text-ink-subtle font-sans text-sm">Tamamlanmış randevu yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="text-left text-ink-subtle border-b border-line">
                  <th className="font-medium pb-3">Personel</th>
                  <th className="font-medium pb-3 text-right">Tamamlanan</th>
                  <th className="font-medium pb-3 text-right">Ciro</th>
                </tr>
              </thead>
              <tbody>
                {staffPerf.map((s) => (
                  <tr key={s.name} className="border-b border-line/60 last:border-0">
                    <td className="py-3 text-ink font-medium">{s.name}</td>
                    <td className="py-3 text-ink-muted text-right tabular-nums">{s.completed}</td>
                    <td className="py-3 text-ink font-semibold text-right tabular-nums">{formatPrice(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-40 rounded-lg bg-surface-soft" />
        <div className="h-4 w-64 rounded bg-surface-soft mt-2" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card border border-line">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-surface-soft" />
              <div className="h-4 w-24 rounded bg-surface-soft" />
            </div>
            <div className="h-7 w-20 rounded bg-surface-soft" />
          </div>
        ))}
      </div>
      <div className="card border border-line">
        <div className="h-5 w-48 rounded bg-surface-soft mb-6" />
        <div className="h-[220px] rounded-xl bg-surface-soft" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card border border-line">
            <div className="h-5 w-40 rounded bg-surface-soft mb-6" />
            <div className="h-[240px] rounded-xl bg-surface-soft" />
          </div>
        ))}
      </div>
      <div className="card border border-line">
        <div className="h-5 w-48 rounded bg-surface-soft mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-surface-soft" />
          ))}
        </div>
      </div>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-surface border border-line rounded-xl p-3 shadow-lg">
        <p className="text-ink-subtle font-sans text-xs mb-1">{label}</p>
        <p className="text-brand font-sans font-semibold">{formatPrice(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

function CountTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    const p = payload[0];
    return (
      <div className="bg-surface border border-line rounded-xl p-2.5 shadow-lg font-sans text-sm">
        <span className="text-ink font-medium">{p.payload.name}: </span>
        <span className="text-brand font-semibold">{p.value}</span>
      </div>
    );
  }
  return null;
}

"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface RevenueChartProps {
  tenantId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-black-soft border border-black-border rounded-xl p-3 shadow-card">
        <p className="text-white/50 text-xs mb-1">{label}</p>
        <p className="text-gold-500 font-semibold">
          ₺{payload[0].value.toLocaleString("tr-TR")}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueChart({ tenantId }: RevenueChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRevenue() {
      const days = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(new Date(), 13 - i);
        return format(date, "yyyy-MM-dd");
      });

      const start = days[0] + "T00:00:00";
      const end = days[days.length - 1] + "T23:59:59";

      const { data: appointments } = await supabase
        .from("appointments")
        .select("starts_at, final_price")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("starts_at", start)
        .lte("starts_at", end);

      const dailyRevenue = days.map((day) => ({
        date: format(parseISO(day), "d MMM", { locale: tr }),
        revenue: appointments
          ?.filter((a) => a.starts_at.startsWith(day))
          .reduce((sum, a) => sum + a.final_price, 0) ?? 0,
      }));

      setData(dailyRevenue);
      setLoading(false);
    }

    fetchRevenue();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-6 w-32 mb-6 rounded" />
        <div className="skeleton h-48 rounded" />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-white">Günlük Ciro (Son 14 Gün)</h3>
        <span className="text-white/30 text-xs">₺ TRY</span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#ffffff40", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#ffffff40", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₺${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#C9A84C"
            strokeWidth={2}
            fill="url(#goldGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

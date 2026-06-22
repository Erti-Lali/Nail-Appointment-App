"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrice } from "@nailstudio/shared";
import { TrendingUp } from "lucide-react";

interface MiniRevenueChartProps {
  // Son 7 gün, eskiden yeniye sıralı: { label: "Pzt", revenue: 1234 }
  data: { label: string; revenue: number }[];
}

const MiniTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface border border-line rounded-lg px-2.5 py-1.5 shadow-card">
        <p className="text-ink-subtle text-[10px] mb-0.5">{label}</p>
        <p className="text-brand font-semibold text-xs">{formatPrice(payload[0].value, "TRY")}</p>
      </div>
    );
  }
  return null;
};

export function MiniRevenueChart({ data }: MiniRevenueChartProps) {
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const today = data[data.length - 1]?.revenue ?? 0;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-ink-subtle text-xs">Son 7 günün cirosu</p>
          <p className="font-display text-2xl font-bold text-ink mt-0.5 leading-tight">{formatPrice(total, "TRY")}</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-brand text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> Bugün
          </span>
          <p className="text-ink-muted text-sm font-semibold mt-0.5">{formatPrice(today, "TRY")}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="miniRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--ns-brand))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(var(--ns-brand))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<MiniTooltip />} cursor={{ stroke: "rgb(var(--ns-brand))", strokeOpacity: 0.2 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="rgb(var(--ns-brand))"
            strokeWidth={2}
            fill="url(#miniRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

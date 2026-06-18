"use client";

import { Calendar, Users, TrendingUp, Star } from "lucide-react";
import { formatPrice } from "@nailstudio/shared";

interface DashboardStatsProps {
  appointmentsToday: number;
  totalCustomers: number;
  monthRevenue: number;
}

export function DashboardStats({
  appointmentsToday,
  totalCustomers,
  monthRevenue,
}: DashboardStatsProps) {
  const stats = [
    {
      icon: Calendar,
      label: "Bugünkü Randevular",
      value: appointmentsToday.toString(),
      sub: "aktif randevu",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: Users,
      label: "Toplam Müşteri",
      value: totalCustomers.toLocaleString("tr-TR"),
      sub: "kayıtlı müşteri",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      icon: TrendingUp,
      label: "Bu Ay Ciro",
      value: formatPrice(monthRevenue, "TRY"),
      sub: "bu ay toplam",
      color: "text-gold-500",
      bg: "bg-gold-500/10",
      border: "border-gold-500/20",
    },
    {
      icon: Star,
      label: "Ortalama Puan",
      value: "4.8",
      sub: "müşteri değerlendirmesi",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`card border ${stat.border} group hover:shadow-card transition-all duration-200`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-xs font-medium mb-3">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-white/30 text-xs mt-1">{stat.sub}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

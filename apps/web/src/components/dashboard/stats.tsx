"use client";

import { CalendarDays, Wallet, Users, Cake } from "lucide-react";
import { formatPrice } from "@nailstudio/shared";

interface DashboardStatsProps {
  appointmentsToday: number;
  monthRevenue: number;
  totalCustomers: number;
  birthdaysThisWeek: number;
}

export function DashboardStats({
  appointmentsToday,
  monthRevenue,
  totalCustomers,
  birthdaysThisWeek,
}: DashboardStatsProps) {
  // Tek disiplinli aksan (gül) — sayılar hiyerarşiyi taşır, ikonlar değil.
  // Ciro studyo sahibinin önemsediği sayıdır: display yüz + hafif vurgulu kart.
  const stats = [
    { icon: CalendarDays, label: "Bugünkü randevu", value: appointmentsToday.toString(), sub: "planlanan" },
    { icon: Wallet, label: "Bu ay ciro", value: formatPrice(monthRevenue, "TRY"), sub: "tamamlanan", hero: true },
    { icon: Users, label: "Toplam müşteri", value: totalCustomers.toLocaleString("tr-TR"), sub: "kayıtlı" },
    { icon: Cake, label: "Bu hafta doğum günü", value: birthdaysThisWeek.toString(), sub: "kutlanacak" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`card transition-all duration-200 hover:shadow-card ${
            stat.hero ? "border-brand/30 bg-brand-soft/40" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-ink-subtle text-xs font-medium">{stat.label}</p>
            <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
              <stat.icon className="w-[18px] h-[18px] text-brand" strokeWidth={1.75} />
            </div>
          </div>
          <p className={`mt-3 leading-tight text-ink ${stat.hero ? "font-display text-3xl font-bold" : "text-2xl font-bold"}`}>
            {stat.value}
          </p>
          <p className="text-ink-subtle text-xs mt-1">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

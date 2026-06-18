"use client";

import Link from "next/link";
import { CalendarPlus, UserPlus, MessageSquare, BarChart3, Sparkles } from "lucide-react";

const ACTIONS = [
  {
    icon: CalendarPlus,
    label: "Randevu Ekle",
    href: "/appointments/new",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "hover:border-blue-500/40",
  },
  {
    icon: UserPlus,
    label: "Müşteri Ekle",
    href: "/customers/new",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "hover:border-purple-500/40",
  },
  {
    icon: MessageSquare,
    label: "SMS Gönder",
    href: "/notifications/sms",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "hover:border-green-500/40",
  },
  {
    icon: BarChart3,
    label: "Raporlar",
    href: "/analytics",
    color: "text-gold-500",
    bg: "bg-gold-500/10",
    border: "hover:border-gold-500/40",
  },
  {
    icon: Sparkles,
    label: "AI Asistan",
    href: "/ai",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "hover:border-pink-500/40",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`card border border-black-border ${action.border}
                      flex flex-col items-center gap-2.5 py-5 transition-all duration-200
                      hover:scale-[1.02] active:scale-[0.98]`}
        >
          <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center`}>
            <action.icon className={`w-5 h-5 ${action.color}`} />
          </div>
          <span className="text-white/70 text-xs font-medium text-center">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

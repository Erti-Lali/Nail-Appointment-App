"use client";

import Link from "next/link";
import { CalendarPlus, UserPlus, MessageSquare, Settings } from "lucide-react";

const ACTIONS = [
  { icon: CalendarPlus, label: "Yeni Randevu", href: "/appointments?new=1" },
  { icon: UserPlus, label: "Yeni Müşteri", href: "/customers?new=1" },
  { icon: MessageSquare, label: "SMS Gönder", href: "/notifications" },
  { icon: Settings, label: "Ayarlar", href: "/settings" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="card-hover border border-line flex flex-col items-center gap-2.5 py-5"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center">
            <action.icon className="w-5 h-5 text-brand" />
          </div>
          <span className="text-ink-muted text-xs font-medium text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

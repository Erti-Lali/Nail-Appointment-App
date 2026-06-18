"use client";

import { Bell, Search, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/appointments": "Randevular",
  "/customers": "Müşteriler",
  "/services": "Hizmetler",
  "/staff": "Personel",
  "/shifts": "Vardiyalar",
  "/analytics": "Analitik",
  "/content": "İçerik Yönetimi",
  "/settings": "Ayarlar",
  "/notifications": "Bildirimler",
};

interface HeaderProps {
  profile: any;
  onMenuClick?: () => void;
}

export function Header({ profile, onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    pathname === path || pathname.startsWith(path + "/")
  )?.[1] ?? "NailStudio 101";

  return (
    <header className="h-16 border-b border-black-border bg-black-soft/50 backdrop-blur-sm flex items-center px-4 sm:px-6 gap-3 sm:gap-4 shrink-0">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black-border transition-colors shrink-0"
        aria-label="Menüyü aç"
      >
        <Menu className="w-5 h-5 text-white/70" />
      </button>

      {/* Page title */}
      <h2 className="text-white font-semibold text-base sm:text-lg flex-1 truncate">{title}</h2>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Ara..."
          className="w-56 bg-black border border-black-border rounded-xl pl-9 pr-4 py-2 text-sm
                     text-white placeholder:text-white/30 outline-none focus:border-gold-500/50
                     focus:w-72 transition-all duration-300"
        />
      </div>

      {/* Notifications */}
      <Link
        href="/notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl
                   hover:bg-black-border transition-colors"
      >
        <Bell className="w-4 h-4 text-white/60" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full" />
      </Link>
    </header>
  );
}

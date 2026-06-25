"use client";

import { Bell, Search, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/appointments":  "Randevular",
  "/customers":     "Müşteriler",
  "/services":      "Hizmetler",
  "/staff":         "Personel",
  "/shifts":        "Vardiyalar",
  "/analytics":     "Analitik",
  "/content":       "İçerik Yönetimi",
  "/settings":      "Ayarlar",
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
    <header
      className="h-16 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 shrink-0 backdrop-blur-sm"
      style={{
        background: "rgba(250,243,240,0.85)",
        borderBottom: "1px solid rgb(var(--ns-line))",
      }}
    >
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0"
        style={{ color: "rgb(var(--ns-ink-muted))" }}
        aria-label="Menüyü aç"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h2
        className="font-display font-semibold text-base sm:text-lg flex-1 truncate"
        style={{ color: "rgb(var(--ns-ink))", letterSpacing: "0.5px" }}
      >
        {title}
      </h2>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "rgb(var(--ns-ink-subtle))" }}
        />
        <input
          type="text"
          placeholder="Ara..."
          className="w-52 rounded-xl pl-9 pr-4 py-2 text-sm outline-none transition-all duration-300 focus:w-68"
          style={{
            background: "rgb(var(--ns-surface-soft))",
            border: "1px solid rgb(var(--ns-line))",
            color: "rgb(var(--ns-ink))",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgb(var(--ns-brand))"; e.currentTarget.style.boxShadow = "0 0 0 3px rgb(var(--ns-brand) / 0.10)"; }}
          onBlur={e  => { e.currentTarget.style.borderColor = "rgb(var(--ns-line))";  e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>

      {/* Notifications */}
      <Link
        href="/notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
        style={{ color: "rgb(var(--ns-ink-muted))" }}
      >
        <Bell className="w-4 h-4" />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: "rgb(var(--ns-brand))" }}
        />
      </Link>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{
          background: "linear-gradient(135deg,rgb(var(--ns-brand)) 0%,rgb(var(--ns-brand-dark)) 100%)",
          color: "#FFFFFF",
        }}
      >
        {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
      </div>
    </header>
  );
}

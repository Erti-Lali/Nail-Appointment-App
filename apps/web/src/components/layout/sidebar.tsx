"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard, Calendar, Users, Scissors, UserCheck,
  BarChart3, Settings, LogOut,
  Bell, ChevronRight, X, CalendarClock, Shield, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/dashboard" },
  { icon: Calendar,        label: "Randevular",  href: "/appointments" },
  { icon: Users,           label: "Müşteriler",  href: "/customers" },
  { icon: Scissors,        label: "Hizmetler",   href: "/services" },
  { icon: UserCheck,       label: "Personel",    href: "/staff" },
  { icon: CalendarClock,   label: "Vardiyalar",  href: "/shifts" },
  { icon: BarChart3,       label: "Analitik",    href: "/analytics" },
  // İçerik (/content) ilk sürümde gizlendi — sayfa + upload API + storage kodu duruyor,
  // sonraki sürümde nav'a geri eklenecek.
];

const BOTTOM_ITEMS = [
  { icon: Bell,     label: "Bildirimler", href: "/notifications" },
  { icon: Settings, label: "Ayarlar",     href: "/settings" },
];

interface SidebarProps {
  profile: any;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ profile, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => { onClose?.(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 backdrop-blur-sm md:hidden transition-opacity",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        style={{ background: "rgba(45,10,26,0.5)" }}
      />

      <aside
        className={cn(
          "w-64 flex flex-col shrink-0",
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "#2D0A1A",
          borderRight: "1px solid rgba(229,166,185,0.12)",
        }}
      >
        {/* ── Logo ── */}
        <div
          className="p-6 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(229,166,185,0.10)" }}
        >
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {/* Nail drop icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#C4356A 0%,#9B2550 100%)", boxShadow: "0 4px 16px rgba(196,53,106,0.40)" }}
            >
              <svg width="18" height="18" viewBox="0 0 38 38" fill="none">
                <path d="M19 8C19 8 12 13 12 21C12 25.3 15.1 28 19 28C22.9 28 26 25.3 26 21C26 13 19 8 19 8Z" fill="white"/>
                <path d="M13 8L13 4M19 6L19 2M25 8L25 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="font-display font-semibold text-sm leading-tight" style={{ color: "#F5ECF0", letterSpacing: "1.5px" }}>
                NAIL<span style={{ color: "#E5A6B9" }}>STUDIO</span>
              </p>
              <p className="text-[10px] font-medium tracking-widest" style={{ color: "#9B6E7A" }}>1 0 1</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "rgba(229,166,185,0.5)" }}
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tenant ── */}
        {profile?.tenants && (
          <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: "rgba(229,166,185,0.07)", border: "1px solid rgba(229,166,185,0.12)" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(196,53,106,0.25)" }}>
                <Crown className="w-3.5 h-3.5" style={{ color: "#E5A6B9" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "#F5ECF0" }}>{profile.tenants.name}</p>
                <p className="text-[10px]" style={{ color: "#9B6E7A" }}>Pro Plan</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-medium tracking-widest uppercase" style={{ color: "rgba(155,110,122,0.6)" }}>Menü</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer text-sm"
                style={isActive
                  ? { background: "rgba(196,53,106,0.20)", color: "#E5A6B9", fontWeight: 500 }
                  : { color: "rgba(229,166,185,0.55)" }
                }
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(229,166,185,0.90)"; (e.currentTarget as HTMLElement).style.background = "rgba(229,166,185,0.06)"; }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = "rgba(229,166,185,0.55)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: "#C4356A" }} />}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom ── */}
        <div className="px-3 pb-4 space-y-0.5 pt-4" style={{ borderTop: "1px solid rgba(229,166,185,0.10)" }}>
          {profile?.role === "super_admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer text-sm"
              style={{ color: "rgba(229,166,185,0.55)" }}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Platform Yönetimi</span>
            </Link>
          )}
          {BOTTOM_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer text-sm"
                style={isActive
                  ? { background: "rgba(196,53,106,0.20)", color: "#E5A6B9", fontWeight: 500 }
                  : { color: "rgba(229,166,185,0.55)" }
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* User */}
          <div className="mt-2 p-3 rounded-xl transition-colors cursor-pointer" style={{ color: "inherit" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "linear-gradient(135deg,#C4356A,#9B2550)", color: "#FFFFFF" }}
              >
                {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "#F5ECF0" }}>
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-[10px] capitalize truncate" style={{ color: "#9B6E7A" }}>
                  {profile?.role?.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="transition-colors"
                style={{ color: "rgba(229,166,185,0.35)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EF4444"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(229,166,185,0.35)"}
                title="Çıkış Yap"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

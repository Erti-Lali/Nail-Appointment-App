"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard, Calendar, Users, Scissors, UserCheck,
  BarChart3, Settings, Image, LogOut, Sparkles, Crown,
  Bell, ChevronRight, X, CalendarClock, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Randevular", href: "/appointments" },
  { icon: Users, label: "Müşteriler", href: "/customers" },
  { icon: Scissors, label: "Hizmetler", href: "/services" },
  { icon: UserCheck, label: "Personel", href: "/staff" },
  { icon: CalendarClock, label: "Vardiyalar", href: "/shifts" },
  { icon: BarChart3, label: "Analitik", href: "/analytics" },
  { icon: Image, label: "İçerik", href: "/content" },
];

const BOTTOM_ITEMS = [
  { icon: Bell, label: "Bildirimler", href: "/notifications" },
  { icon: Settings, label: "Ayarlar", href: "/settings" },
];

interface SidebarProps {
  profile: any;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ profile, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
          "fixed inset-0 z-30 bg-overlay backdrop-blur-sm md:hidden transition-opacity",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "w-64 flex flex-col bg-black-soft border-r border-black-border shrink-0",
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-black-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">
                NailStudio
              </p>
              <p className="text-gold-500 text-xs font-medium">101</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black-border transition-colors"
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

      {/* Tenant info */}
      {profile?.tenants && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-black border border-black-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-gold-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {profile.tenants.name}
              </p>
              <p className="text-white/40 text-[10px]">Pro Plan</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 pb-2">
          Menü
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-item", isActive && "active")}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-auto text-gold-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-black-border pt-4">
        {profile?.role === "super_admin" && (
          <Link
            href="/admin"
            className={cn("sidebar-item", pathname.startsWith("/admin") && "active")}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="text-sm">Platform Yönetimi</span>
          </Link>
        )}
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-item", isActive && "active")}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* User */}
        <div className="mt-2 p-3 rounded-xl hover:bg-black cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
              <span className="text-gold-500 text-xs font-bold">
                {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-white/40 text-[10px] truncate capitalize">
                {profile?.role?.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/30 hover:text-red-400 transition-colors"
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

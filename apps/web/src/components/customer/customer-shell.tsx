"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { FullPageSpinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Sparkles, CalendarDays, User, Heart, Bell, LogOut } from "lucide-react";

type NavKey = "appointments" | "profile" | "favorites";

const NAV: { key: NavKey; label: string; href: string; icon: typeof CalendarDays }[] = [
  { key: "appointments", label: "Randevularım", href: "/hesabim", icon: CalendarDays },
  { key: "profile", label: "Profilim", href: "/hesabim/profil", icon: User },
  { key: "favorites", label: "Favorilerim", href: "/hesabim/favoriler", icon: Heart },
];

export function CustomerShell({ active, children }: { active: NavKey; children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState<{ first: string; last: string }>({ first: "", last: "" });

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/hesabim/giris"); return; }
      const res = await fetch("/api/customer/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setName({ first: d.firstName ?? "", last: d.lastName ?? "" });
      }
      setReady(true);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); router.push("/hesabim/giris"); };

  if (!ready) return <FullPageSpinner />;

  const initials = `${name.first.charAt(0)}${name.last.charAt(0)}`.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-canvas text-ink pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/hesabim" className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-surface" />
            </div>
            <span className="font-bold text-sm truncate">NailStudio</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              title="Bildirimler (yakında)"
              className="relative w-9 h-9 rounded-xl hover:bg-brand-soft text-ink-muted hover:text-brand flex items-center justify-center transition-colors"
            >
              <Bell className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0">
                {initials}
              </div>
              {name.first && <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">{name.first}</span>}
            </div>
            <button
              onClick={signOut}
              title="Çıkış"
              className="w-9 h-9 rounded-xl hover:bg-red-50 text-ink-muted hover:text-red-500 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-6 py-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-20 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active === item.key
                    ? "bg-brand text-surface shadow-gold"
                    : "text-ink-muted hover:bg-brand-soft hover:text-brand",
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line">
        <div className="flex">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                active === item.key ? "text-brand" : "text-ink-subtle",
              )}
            >
              <item.icon className={cn("w-5 h-5", active === item.key && "fill-brand/10")} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

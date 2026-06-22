"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatPrice, minutesToDisplay } from "@nailstudio/shared";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Store, Scissors, MapPin, CalendarPlus, Heart, Clock } from "lucide-react";

type Tab = "studio" | "service";

export default function FavoritesPage() {
  const supabase = createClient();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("studio");
  const [favorites, setFavorites] = useState<any[]>([]);

  const load = async (tk: string) => {
    const res = await fetch("/api/customer/favorites", { headers: { Authorization: `Bearer ${tk}` } });
    if (res.ok) { const d = await res.json(); setFavorites(d.favorites ?? []); }
  };

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setToken(session.access_token);
      await load(session.access_token);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (favoriteId: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    const res = await fetch("/api/customer/favorites", {
      method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ favoriteId }),
    });
    if (!res.ok) { toast.error("Silinemedi"); load(token); } else toast.success("Favorilerden çıkarıldı");
  };

  const studios = favorites.filter((f) => f.type === "studio");
  const services = favorites.filter((f) => f.type === "service");
  const list = tab === "studio" ? studios : services;

  return (
    <CustomerShell active="favorites">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink">Favorilerim</h1>
        <p className="text-ink-subtle text-sm mt-1">Beğendiğiniz stüdyo ve hizmetlerden hızlıca randevu alın.</p>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-surface-soft border border-line rounded-xl p-1 mb-5">
        <TabButton active={tab === "studio"} onClick={() => setTab("studio")} icon={Store} label="Stüdyolar" count={studios.length} />
        <TabButton active={tab === "service"} onClick={() => setTab("service")} icon={Scissors} label="Hizmetler" count={services.length} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : list.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {tab === "studio"
              ? studios.map((f) => <StudioCard key={f.id} fav={f} onRemove={() => remove(f.id)} />)
              : services.map((f) => <ServiceCard key={f.id} fav={f} onRemove={() => remove(f.id)} />)}
          </motion.div>
        </AnimatePresence>
      )}
    </CustomerShell>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof Store; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        active ? "bg-surface text-brand shadow-card" : "text-ink-muted hover:text-ink")}
    >
      <Icon className="w-4 h-4" /> {label}
      <span className={cn("text-xs rounded-full px-1.5", active ? "bg-brand-soft text-brand" : "text-ink-subtle")}>{count}</span>
    </button>
  );
}

function StudioCard({ fav, onRemove }: { fav: any; onRemove: () => void }) {
  const s = fav.studio;
  return (
    <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0 overflow-hidden">
            {s.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover" />
              : (s.name?.[0] ?? "💅")}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink truncate">{s.name}</p>
            {s.city && <p className="text-xs text-ink-subtle flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {s.city}</p>}
          </div>
        </div>
        <button onClick={onRemove} title="Favorilerden çıkar" className="text-brand shrink-0"><Heart className="w-[18px] h-[18px] fill-brand" /></button>
      </div>
      <Link href={`/book/${s.slug}`} className="mt-4 inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark text-surface text-sm font-semibold py-2 rounded-xl transition-colors">
        <CalendarPlus className="w-4 h-4" /> Randevu Al
      </Link>
    </div>
  );
}

function ServiceCard({ fav, onRemove }: { fav: any; onRemove: () => void }) {
  const s = fav.service;
  const slug = s.tenant?.slug;
  return (
    <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5 text-brand shrink-0" /> {s.name}</p>
          {s.tenant?.name && <p className="text-xs text-ink-subtle flex items-center gap-1 mt-1"><Store className="w-3 h-3" /> {s.tenant.name}</p>}
          <p className="text-xs text-ink-muted flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {minutesToDisplay(s.duration_minutes ?? 0)}</span>
            <span className="text-brand font-semibold">{formatPrice(s.price ?? 0, "TRY")}</span>
          </p>
        </div>
        <button onClick={onRemove} title="Favorilerden çıkar" className="text-brand shrink-0"><Heart className="w-[18px] h-[18px] fill-brand" /></button>
      </div>
      {slug && (
        <Link href={`/book/${slug}`} className="mt-4 inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark text-surface text-sm font-semibold py-2 rounded-xl transition-colors">
          <CalendarPlus className="w-4 h-4" /> Randevu Al
        </Link>
      )}
    </div>
  );
}

function EmptyFavorites() {
  return (
    <div className="bg-surface border border-line rounded-3xl p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-3">
        <Heart className="w-7 h-7 text-brand" />
      </div>
      <h3 className="font-display text-lg font-bold text-ink">Henüz favoriniz yok</h3>
      <p className="text-ink-muted text-sm mt-2 max-w-sm mx-auto">
        Stüdyonun randevu linkinden randevu aldıktan sonra stüdyo veya hizmeti favorilerinize ekleyebilirsiniz.
      </p>
    </div>
  );
}

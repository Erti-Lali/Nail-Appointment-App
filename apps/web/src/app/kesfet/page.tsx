"use client";

// ⏸️ ERTELENDİ — Public stüdyo dizini (müşteri keşif akışı).
// Kod tamamlanmış ve çalışır durumda ama ŞİMDİLİK UI'dan link verilmiyor:
// müşteriler yalnızca stüdyoların kendi /book/[slug] linklerinden randevu alır.
// Sonraki aşamada yeniden bağlamak için: landing nav/hero/footer + /hesabim
// boş durumlarına `/kesfet` link'lerini geri ekle (git geçmişine bak).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@nailstudio/shared";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Sparkles, Search, MapPin, Instagram, CalendarPlus, Store, Scissors } from "lucide-react";

interface Studio {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  instagram_handle: string | null;
  serviceCount: number;
  minPrice: number | null;
}

export default function DiscoverPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: tenants }, { data: services }] = await Promise.all([
        supabase
          .from("tenants")
          .select("id, name, slug, city, description, logo_url, cover_url, instagram_handle")
          .eq("is_active", true)
          .order("name"),
        supabase.from("services").select("tenant_id, price").eq("is_active", true),
      ]);

      const byTenant = new Map<string, { count: number; min: number | null }>();
      for (const s of services ?? []) {
        const cur = byTenant.get(s.tenant_id) ?? { count: 0, min: null };
        cur.count += 1;
        const p = Number(s.price ?? 0);
        if (p > 0) cur.min = cur.min == null ? p : Math.min(cur.min, p);
        byTenant.set(s.tenant_id, cur);
      }

      setStudios(
        (tenants ?? []).map((t) => ({
          ...t,
          serviceCount: byTenant.get(t.id)?.count ?? 0,
          minPrice: byTenant.get(t.id)?.min ?? null,
        })),
      );
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cities = useMemo(
    () => [...new Set(studios.map((s) => s.city).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "tr")),
    [studios],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return studios.filter((s) => {
      if (city && s.city !== city) return false;
      if (!q) return true;
      return (
        s.name.toLocaleLowerCase("tr").includes(q) ||
        (s.city ?? "").toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [studios, query, city]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-md border-b border-line">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-gold">
              <Sparkles className="w-5 h-5 text-surface" />
            </div>
            <span className="font-bold text-sm">NailStudio</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/hesabim" className="text-sm font-medium text-ink-muted hover:text-brand px-3 py-2 transition-colors">
              Randevularım
            </Link>
            <Link href="/hesabim/giris" className="text-sm font-semibold bg-brand hover:bg-brand-dark text-surface px-4 py-2 rounded-xl transition-colors shadow-gold">
              Giriş Yap
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero + search */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-6 text-center">
        <span className="inline-flex items-center gap-1.5 bg-brand-soft border border-brand/20 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Sparkles className="w-3.5 h-3.5" /> Online randevu
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight leading-[1.1]">
          Sana en yakın <span className="text-brand">tırnak stüdyosundan</span><br className="hidden sm:block" /> online randevu al
        </h1>
        <p className="mt-4 text-ink-muted max-w-xl mx-auto">
          Uygulamayı kullanan stüdyoları keşfet, hizmeti ve saati seç, dakikalar içinde randevunu oluştur.
        </p>

        <div className="mt-7 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Stüdyo veya şehir ara…"
              className="w-full bg-surface border border-line rounded-2xl pl-10 pr-4 py-3 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
            />
          </div>
          {cities.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Chip active={city === null} onClick={() => setCity(null)}>Tümü</Chip>
              {cities.map((c) => (
                <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c}</Chip>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Studios */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-line rounded-3xl p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-3">
              <Store className="w-7 h-7 text-brand" />
            </div>
            <h3 className="font-display text-lg font-bold text-ink">
              {studios.length === 0 ? "Henüz stüdyo yok" : "Sonuç bulunamadı"}
            </h3>
            <p className="text-ink-muted text-sm mt-2">
              {studios.length === 0
                ? "Şu an aktif bir stüdyo görünmüyor. Daha sonra tekrar deneyin."
                : "Aramanıza uygun stüdyo bulunamadı. Filtreleri değiştirin."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-subtle mb-4">{filtered.length} stüdyo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s, i) => (
                <StudioCard key={s.id} studio={s} index={i} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
        active ? "bg-brand border-brand text-surface" : "bg-surface border-line text-ink-muted hover:border-brand/40",
      )}
    >
      {children}
    </button>
  );
}

function StudioCard({ studio: s, index }: { studio: Studio; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
    >
      <Link
        href={`/book/${s.slug}`}
        className="group block bg-surface border border-line rounded-2xl overflow-hidden hover:border-brand/40 hover:shadow-card transition-all"
      >
        {/* Cover */}
        <div className="relative h-28 bg-gradient-to-br from-brand/20 to-brand-soft">
          {s.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.cover_url} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-2xl bg-surface border border-line shadow-card flex items-center justify-center overflow-hidden text-xl font-bold text-brand">
            {s.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover" />
            ) : (
              s.name?.[0] ?? "💅"
            )}
          </div>
        </div>

        <div className="pt-8 px-4 pb-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ink truncate group-hover:text-brand transition-colors">{s.name}</h3>
            {s.instagram_handle && <Instagram className="w-4 h-4 text-ink-subtle shrink-0 mt-0.5" />}
          </div>
          {s.city && (
            <p className="text-xs text-ink-subtle flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {s.city}</p>
          )}
          {s.description && (
            <p className="text-sm text-ink-muted mt-2 line-clamp-2">{s.description}</p>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-ink-muted">
            {s.serviceCount > 0 && (
              <span className="flex items-center gap-1"><Scissors className="w-3 h-3" /> {s.serviceCount} hizmet</span>
            )}
            {s.minPrice != null && (
              <span className="text-brand font-semibold">{formatPrice(s.minPrice, "TRY")}'den</span>
            )}
          </div>

          <div className="mt-4 inline-flex items-center justify-center gap-1.5 w-full bg-brand-soft group-hover:bg-brand text-brand group-hover:text-surface text-sm font-semibold py-2 rounded-xl transition-colors">
            <CalendarPlus className="w-4 h-4" /> Randevu Al
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

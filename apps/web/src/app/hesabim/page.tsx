"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CustomerShell } from "@/components/customer/customer-shell";
import { AppointmentCard } from "@/components/customer/appointment-card";
import { Spinner } from "@/components/ui";

export default function MyAccountPage() {
  const supabase = createClient();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  // tenant_id -> favorite row id (studios the customer has favorited)
  const [favStudios, setFavStudios] = useState<Map<string, string>>(new Map());

  const loadAppointments = useCallback(async (tk: string) => {
    const res = await fetch("/api/customer/appointments", { headers: { Authorization: `Bearer ${tk}` } });
    if (res.ok) { const d = await res.json(); setAppointments(d.appointments ?? []); }
  }, []);

  const loadFavorites = useCallback(async (tk: string) => {
    const res = await fetch("/api/customer/favorites", { headers: { Authorization: `Bearer ${tk}` } });
    if (res.ok) {
      const d = await res.json();
      const m = new Map<string, string>();
      for (const f of d.favorites ?? []) {
        if (f.type === "studio" && f.studio?.id) m.set(f.studio.id, f.id);
      }
      setFavStudios(m);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // shell handles redirect
      setToken(session.access_token);
      await Promise.all([loadAppointments(session.access_token), loadFavorites(session.access_token)]);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFavoriteStudio = async (tenantId: string) => {
    const existingId = favStudios.get(tenantId);
    // optimistic
    setFavStudios((prev) => {
      const m = new Map(prev);
      if (existingId) m.delete(tenantId); else m.set(tenantId, "pending");
      return m;
    });
    if (existingId) {
      const res = await fetch("/api/customer/favorites", {
        method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ favoriteId: existingId }),
      });
      if (!res.ok) { toast.error("İşlem başarısız"); loadFavorites(token); }
      else toast.success("Favorilerden çıkarıldı");
    } else {
      const res = await fetch("/api/customer/favorites", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "studio", tenantId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d.error ?? "İşlem başarısız"); loadFavorites(token); }
      else { setFavStudios((prev) => new Map(prev).set(tenantId, d.id)); toast.success("Favorilere eklendi"); }
    }
  };

  const now = Date.now();
  const isUpcoming = (a: any) => new Date(a.starts_at).getTime() >= now && a.status !== "canceled" && a.status !== "no_show";
  const upcoming = appointments.filter(isUpcoming);
  const past = appointments.filter((a) => !isUpcoming(a));
  const canModify = (a: any) => isUpcoming(a) && (a.status === "pending" || a.status === "confirmed");

  return (
    <CustomerShell active="appointments">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink">Randevularım</h1>
        <p className="text-ink-subtle text-sm mt-1">Yaklaşan ve geçmiş randevularınızı buradan yönetin.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : appointments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          <Section title="Yaklaşan" count={upcoming.length} empty="Yaklaşan randevunuz yok.">
            {upcoming.map((a, i) => (
              <AppointmentCard
                key={a.id} appointment={a} token={token} index={i}
                canModify={canModify(a)}
                isFavorite={favStudios.has(a.tenant_id)}
                onToggleFavorite={() => toggleFavoriteStudio(a.tenant_id)}
                onChanged={() => loadAppointments(token)}
              />
            ))}
          </Section>
          <Section title="Geçmiş" count={past.length} empty="Geçmiş randevu yok.">
            {past.map((a, i) => (
              <AppointmentCard
                key={a.id} appointment={a} token={token} index={i}
                canModify={false}
                isFavorite={favStudios.has(a.tenant_id)}
                onToggleFavorite={() => toggleFavoriteStudio(a.tenant_id)}
                onChanged={() => loadAppointments(token)}
              />
            ))}
          </Section>
        </div>
      )}
    </CustomerShell>
  );
}

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
        {title}
        <span className="text-xs font-medium text-ink-subtle bg-surface-soft border border-line rounded-full px-2 py-0.5">{count}</span>
      </h2>
      {count === 0 ? <p className="text-ink-subtle text-sm">{empty}</p> : <div className="space-y-3">{children}</div>}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border border-line rounded-3xl p-10 text-center">
      <svg viewBox="0 0 200 160" className="w-44 h-36 mx-auto mb-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="38" y="36" width="124" height="104" rx="14" fill="rgb(var(--ns-brand-soft))" stroke="rgb(var(--ns-brand) / 0.35)" strokeWidth="2" />
        <rect x="38" y="36" width="124" height="28" rx="14" fill="rgb(var(--ns-brand) / 0.12)" />
        <line x1="66" y1="28" x2="66" y2="46" stroke="rgb(var(--ns-brand))" strokeWidth="4" strokeLinecap="round" />
        <line x1="134" y1="28" x2="134" y2="46" stroke="rgb(var(--ns-brand))" strokeWidth="4" strokeLinecap="round" />
        <circle cx="74" cy="86" r="6" fill="rgb(var(--ns-brand) / 0.4)" />
        <circle cx="100" cy="86" r="6" fill="rgb(var(--ns-brand) / 0.4)" />
        <circle cx="126" cy="86" r="6" fill="rgb(var(--ns-brand) / 0.4)" />
        <circle cx="74" cy="110" r="6" fill="rgb(var(--ns-brand) / 0.4)" />
        <path d="M118 108c2-5 10-5 11 1 1-6 9-6 11-1 2 5-7 12-11 14-4-2-13-9-11-14Z" fill="rgb(var(--ns-brand))" />
        <path d="M150 44l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="rgb(var(--ns-brand) / 0.5)" />
      </svg>
      <h3 className="font-display text-xl font-bold text-ink">Henüz randevunuz yok</h3>
      <p className="text-ink-muted text-sm mt-2 max-w-sm mx-auto">
        Stüdyonun paylaştığı randevu linkinden online randevu aldığınızda, kayıt olurken
        kullandığınız telefon numarasıyla burada görünür.
      </p>
    </div>
  );
}

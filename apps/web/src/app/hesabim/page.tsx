"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@nailstudio/shared";
import { wallTime } from "@/lib/datetime";
import { StatusBadge, FullPageSpinner, Button } from "@/components/ui";
import { Sparkles, LogOut, CalendarDays, Scissors, User as UserIcon, Store, CalendarPlus } from "lucide-react";

export default function MyAccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/hesabim/giris"); return; }
      const res = await fetch("/api/customer/appointments", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setFirstName(d.firstName ?? "");
        setAppointments(d.appointments ?? []);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); router.push("/hesabim/giris"); };

  if (loading) return <FullPageSpinner />;

  const now = Date.now();
  const upcoming = appointments.filter((a) => new Date(a.starts_at).getTime() >= now && a.status !== "canceled" && a.status !== "no_show");
  const past = appointments.filter((a) => !(new Date(a.starts_at).getTime() >= now && a.status !== "canceled" && a.status !== "no_show"));

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-20 bg-[#FFFFFF] border-b border-line">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center"><Sparkles className="w-5 h-5 text-[#FFFFFF]" /></div>
            <span className="font-bold text-sm">Randevularım</span>
          </Link>
          <button onClick={signOut} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-red-500 px-3 py-2 transition-colors">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Merhaba{firstName ? `, ${firstName}` : ""} 👋</h1>
          <p className="text-ink-subtle mt-1 text-sm">Randevularınızı buradan takip edebilirsiniz.</p>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-line rounded-2xl p-8 text-center">
            <CalendarDays className="w-10 h-10 text-brand/40 mx-auto mb-3" />
            <p className="text-ink-muted">Henüz randevunuz yok.</p>
            <p className="text-ink-subtle text-xs mt-1">
              Online randevu aldığınızda, kayıt olurken kullandığınız telefon numarasıyla burada görünür.
            </p>
          </div>
        ) : (
          <>
            <Section title="Yaklaşan" items={upcoming} empty="Yaklaşan randevunuz yok." />
            <Section title="Geçmiş" items={past} empty="Geçmiş randevu yok." />
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, items, empty }: { title: string; items: any[]; empty: string }) {
  return (
    <section>
      <h2 className="font-semibold mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-ink-subtle text-sm">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const services = a.appointment_services?.length
              ? a.appointment_services.map((x: any) => x.service?.name).filter(Boolean)
              : a.service?.name ? [a.service.name] : [];
            return (
              <div key={a.id} className="bg-[#FFFFFF] border border-line rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays className="w-4 h-4 text-brand shrink-0" />
                      {String(a.starts_at).slice(0, 10)} · {wallTime(a.starts_at)}–{wallTime(a.ends_at)}
                    </div>
                    <p className="flex items-center gap-2 text-sm text-ink-muted mt-1.5 truncate"><Scissors className="w-3.5 h-3.5 shrink-0" /> {services.join(", ") || "—"}</p>
                    <p className="flex items-center gap-2 text-sm text-ink-muted mt-1"><UserIcon className="w-3.5 h-3.5 shrink-0" /> {a.staff?.display_name ?? "—"}</p>
                    <p className="flex items-center gap-2 text-sm text-ink-subtle mt-1"><Store className="w-3.5 h-3.5 shrink-0" /> {a.tenant?.name ?? "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={a.status} />
                    <p className="text-brand font-semibold text-sm mt-2">{formatPrice(a.final_price, "TRY")}</p>
                  </div>
                </div>
                {a.tenant?.slug && (
                  <Link href={`/book/${a.tenant.slug}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-dark">
                    <CalendarPlus className="w-3.5 h-3.5" /> Tekrar randevu al
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

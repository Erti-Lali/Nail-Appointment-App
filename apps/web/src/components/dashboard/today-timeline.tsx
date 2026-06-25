"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Plus } from "lucide-react";
import { wallTime, wallMinutes } from "@/lib/datetime";

interface TodayTimelineProps {
  appointments: any[];
  today: string; // yyyy-MM-dd — randevu sayfasına derin link için
}

const START = 8 * 60;   // 08:00
const END = 20 * 60;    // 20:00
const SPAN = END - START;
const HOURS = [8, 10, 12, 14, 16, 18, 20];

function duration(a: any): number {
  if (a.ends_at) {
    const d = wallMinutes(a.ends_at) - wallMinutes(a.starts_at);
    if (d > 0) return d;
  }
  return a.service?.duration_minutes ?? 30;
}

// İmza öğesi: 08:00–20:00 boyunca süzülen canlı "şu an" çizgisi.
function useNowMinutes(): number | null {
  const [mins, setMins] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setMins(now.getHours() * 60 + now.getMinutes());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return mins;
}

export function TodayTimeline({ appointments, today }: TodayTimelineProps) {
  const now = useNowMinutes();
  const nowInRange = now !== null && now >= START && now <= END;
  const nowLeft = nowInRange ? ((now! - START) / SPAN) * 100 : 0;

  // Yalnızca 08:00–20:00 penceresine düşen randevular.
  const visible = appointments.filter((a) => {
    const start = wallMinutes(a.starts_at);
    return start < END && start + duration(a) > START;
  });

  // Personel renk lejantı (çizelgedeki blokları okumak için).
  const staffLegend = Array.from(
    new Map(
      visible
        .filter((a) => a.staff?.display_name)
        .map((a) => [a.staff.display_name, a.staff.color ?? "rgb(var(--ns-brand))"])
    ).entries()
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div>
          <p className="text-ink-subtle text-xs">Günün ritmi</p>
          <h2 className="font-display text-xl font-semibold text-ink leading-tight">Bugünün Çizelgesi</h2>
        </div>
        <Link
          href={`/appointments?view=week&date=${today}`}
          className="text-brand text-xs font-medium hover:text-brand-dark transition-colors shrink-0"
        >
          Takvime git
        </Link>
      </div>

      {/* Personel lejantı */}
      {staffLegend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 mb-5">
          {staffLegend.map(([name, color]) => (
            <span key={name} className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color as string }} />
              {name}
            </span>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="text-center py-10">
          <Clock className="w-10 h-10 mx-auto mb-3 text-ink-subtle opacity-40" />
          <p className="text-sm text-ink-muted">Bugün için planlanmış randevu yok.</p>
          <Link
            href="/appointments?new=1"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> İlk randevuyu ekle
          </Link>
        </div>
      ) : (
        <div className="relative mt-6">
          {/* Saat ızgarası (bloklarla aynı yükseklik) */}
          <div className="absolute inset-x-0 top-0 h-16 flex pointer-events-none">
            {HOURS.slice(0, -1).map((h) => (
              <div key={h} className="flex-1 border-l border-line first:border-l-0" />
            ))}
            <div className="border-l border-line" />
          </div>

          {/* Canlı "şu an" çizgisi */}
          {nowInRange && (
            <div
              className="absolute top-0 h-16 w-px bg-brand z-20 pointer-events-none"
              style={{ left: `${nowLeft}%` }}
            >
              <span className="absolute -top-1 -left-[3px] w-[7px] h-[7px] rounded-full bg-brand shadow-[0_0_0_3px_rgb(var(--ns-brand)/0.18)]" />
            </div>
          )}

          {/* Randevu blokları */}
          <div className="relative h-16">
            {visible.map((a) => {
              const start = wallMinutes(a.starts_at);
              const dur = duration(a);
              const left = Math.max(0, ((start - START) / SPAN) * 100);
              const rawW = (dur / SPAN) * 100;
              const width = Math.min(100 - left, Math.max(rawW, 4));
              const color = a.staff?.color ?? "rgb(var(--ns-brand))";
              const name = `${a.customer?.first_name ?? ""} ${a.customer?.last_name ?? ""}`.trim() || "Müşteri";
              return (
                <Link
                  key={a.id}
                  href={`/appointments?view=week&date=${today}`}
                  title={`${wallTime(a.starts_at)} · ${name} · ${a.service?.name ?? ""} (${a.staff?.display_name ?? ""})`}
                  className="absolute top-0 h-full rounded-lg px-2 py-1.5 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card z-10"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: `color-mix(in srgb, ${color} 14%, white)`,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <p className="text-[11px] font-semibold text-ink truncate leading-tight">{wallTime(a.starts_at)}</p>
                  <p className="text-[11px] text-ink-muted truncate leading-tight">{name}</p>
                </Link>
              );
            })}
          </div>

          {/* Saat etiketleri */}
          <div className="relative flex mt-2 h-5">
            {HOURS.map((h, i) => {
              const isFirst = i === 0;
              const isLast = i === HOURS.length - 1;
              return (
                <div
                  key={h}
                  className={`absolute text-[10px] text-ink-subtle ${isFirst ? "" : isLast ? "-translate-x-full" : "-translate-x-1/2"}`}
                  style={{ left: `${(i / (HOURS.length - 1)) * 100}%` }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

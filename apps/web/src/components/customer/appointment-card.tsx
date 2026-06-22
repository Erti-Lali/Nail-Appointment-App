"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice, minutesToDisplay } from "@nailstudio/shared";
import { StatusBadge } from "@/components/ui";
import { wallTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { Scissors, User as UserIcon, Store, Clock, Heart, CalendarClock, Ban, CalendarPlus } from "lucide-react";
import { CancelModal } from "./cancel-modal";
import { RescheduleModal } from "./reschedule-modal";

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export function AppointmentCard({
  appointment: a,
  token,
  canModify,
  isFavorite,
  onToggleFavorite,
  onChanged,
  index = 0,
}: {
  appointment: any;
  token: string;
  canModify: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onChanged: () => void;
  index?: number;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  const [y, mo, da] = String(a.starts_at).slice(0, 10).split("-");
  const services: string[] = a.appointment_services?.length
    ? a.appointment_services.map((x: any) => x.service?.name).filter(Boolean)
    : a.service?.name ? [a.service.name] : [];
  const staffColor = a.staff?.color ?? "rgb(var(--ns-brand))";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
        className="bg-surface border border-line rounded-2xl overflow-hidden"
      >
        <div className="flex">
          {/* Date block */}
          <div
            className="shrink-0 w-20 flex flex-col items-center justify-center py-4 text-center border-r border-line"
            style={{ background: `color-mix(in srgb, ${staffColor} 8%, white)` }}
          >
            <span className="text-2xl font-display font-bold leading-none text-ink">{da}</span>
            <span className="text-xs font-medium text-ink-muted mt-1 uppercase">{MONTHS_TR[Number(mo) - 1]}</span>
            <span className="text-[10px] text-ink-subtle">{y}</span>
          </div>

          {/* Middle */}
          <div className="flex-1 min-w-0 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-brand shrink-0" />
                  {services.join(", ") || "Hizmet"}
                </p>
                <p className="text-sm text-ink-muted mt-1.5 flex items-center gap-1.5 truncate">
                  <UserIcon className="w-3.5 h-3.5 shrink-0" /> {a.staff?.display_name ?? "—"}
                </p>
                <p className="text-sm text-ink-subtle mt-1 flex items-center gap-1.5 truncate">
                  <Store className="w-3.5 h-3.5 shrink-0" /> {a.tenant?.name ?? "—"}
                </p>
                <p className="text-xs text-ink-subtle mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {wallTime(a.starts_at)}–{wallTime(a.ends_at)} · {minutesToDisplay(a.duration_minutes ?? 0)}
                </p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <StatusBadge status={a.status} />
                <p className="text-brand font-bold text-sm">{formatPrice(a.final_price, "TRY")}</p>
                {a.tenant_id && (
                  <button
                    onClick={onToggleFavorite}
                    title={isFavorite ? "Favorilerden çıkar" : "Stüdyoyu favorilere ekle"}
                    className="text-ink-subtle hover:text-brand transition-colors"
                  >
                    <Heart className={cn("w-[18px] h-[18px]", isFavorite && "fill-brand text-brand")} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-line bg-surface-soft/50 flex-wrap">
          {canModify && (
            <>
              <button
                onClick={() => setShowReschedule(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-brand border border-line hover:border-brand rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <CalendarClock className="w-3.5 h-3.5" /> Değiştir
              </button>
              <button
                onClick={() => setShowCancel(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-red-500 border border-line hover:border-red-300 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" /> İptal Et
              </button>
            </>
          )}
          {a.tenant?.slug && (
            <Link
              href={`/book/${a.tenant.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-dark rounded-lg px-2.5 py-1.5 transition-colors ml-auto"
            >
              <CalendarPlus className="w-3.5 h-3.5" /> Tekrar randevu al
            </Link>
          )}
        </div>
      </motion.div>

      {showCancel && (
        <CancelModal appointment={a} token={token} onClose={() => setShowCancel(false)} onSuccess={onChanged} />
      )}
      {showReschedule && (
        <RescheduleModal appointment={a} token={token} onClose={() => setShowReschedule(false)} onSuccess={onChanged} />
      )}
    </>
  );
}

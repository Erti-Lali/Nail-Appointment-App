"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { X, Phone, Clock, Scissors, User, CheckCircle2, XCircle, RotateCcw, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, minutesToDisplay } from "@nailstudio/shared";
import { wallTime } from "@/lib/datetime";
import type { Enum } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const STATUSES = [
  { value: "pending",     label: "Bekliyor",       icon: AlertCircle,   color: "text-[rgb(var(--ns-warning))]" },
  { value: "confirmed",   label: "Onayla",         icon: CheckCircle2,  color: "text-[rgb(var(--ns-success))]" },
  { value: "in_progress", label: "Başladı",        icon: RotateCcw,     color: "text-[rgb(var(--ns-info))]" },
  { value: "completed",   label: "Tamamlandı",     icon: CheckCircle2,  color: "text-[rgb(var(--ns-neutral))]" },
  { value: "canceled",    label: "İptal Et",       icon: XCircle,       color: "text-[rgb(var(--ns-danger))]" },
  { value: "no_show",     label: "Gelmedi",        icon: XCircle,       color: "text-[rgb(var(--ns-noshow))]" },
] as const;

interface AppointmentDetailModalProps {
  appointment: any;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}

export function AppointmentDetailModal({
  appointment: appt,
  onClose,
  onStatusChange,
}: AppointmentDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [staffNote, setStaffNote] = useState(appt.staff_notes ?? "");
  const supabase = createClient();

  // All services on this appointment (junction); fall back to the single service.
  const apptServices: any[] = appt.appointment_services?.length
    ? appt.appointment_services.map((a: any) => a.service).filter(Boolean)
    : appt.service
      ? [appt.service]
      : [];

  const handleStatusChange = async (newStatus: Enum<"appointment_status">) => {
    if (newStatus === appt.status) return;
    setLoading(true);
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appt.id);

    if (error) {
      toast.error("Güncelleme başarısız");
    } else {
      toast.success("Durum güncellendi");
      onStatusChange(appt.id, newStatus);
    }
    setLoading(false);
  };

  const saveNote = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("appointments")
      .update({ staff_notes: staffNote })
      .eq("id", appt.id);

    if (error) toast.error("Not kaydedilemedi");
    else toast.success("Not kaydedildi");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-black-soft border border-black-border rounded-2xl shadow-card overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black-border">
          <div>
            <h2 className="text-white font-semibold">Randevu Detayı</h2>
            <p className="text-white/40 text-xs mt-0.5">
              {format(parseISO(appt.starts_at), "d MMMM yyyy, EEEE", { locale: tr })}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Customer */}
          <div className="flex items-center gap-3 p-4 bg-black-soft rounded-xl border border-black-border">
            <div className="w-12 h-12 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
              <span className="text-gold-500 font-bold">
                {appt.customer?.first_name?.charAt(0)}{appt.customer?.last_name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">
                {appt.customer?.first_name} {appt.customer?.last_name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Phone className="w-3 h-3 text-white/30" />
                <a
                  href={`tel:${appt.customer?.phone}`}
                  className="text-white/50 text-sm hover:text-gold-500 transition-colors"
                >
                  {appt.customer?.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-black-soft rounded-xl border border-black-border p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Scissors className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/30 text-xs">Hizmetler ({apptServices.length})</span>
            </div>
            <div className="space-y-1.5">
              {apptServices.map((s: any, i: number) => (
                <div key={s.id ?? i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-white truncate">{s.name}</span>
                  <span className="text-white/40 text-xs whitespace-nowrap shrink-0">
                    {s.duration_minutes ? `${s.duration_minutes} dk` : ""}
                    {s.price != null ? ` · ${formatPrice(s.price, "TRY")}` : ""}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black-border text-xs">
              <span className="text-white/30">Toplam Süre</span>
              <span className="text-white/70">{minutesToDisplay(appt.duration_minutes)}</span>
            </div>
          </div>

          {/* Appointment details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: User,
                label: "Personel",
                value: appt.staff?.display_name,
                color: appt.staff?.color,
              },
              {
                icon: Clock,
                label: "Saat",
                value: `${wallTime(appt.starts_at)} – ${wallTime(appt.ends_at)}`,
              },
            ].map((item) => (
              <div key={item.label} className="bg-black-soft rounded-xl border border-black-border p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <item.icon className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-white/30 text-xs">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.color && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  )}
                  <p className="text-white font-medium text-sm">{item.value}</p>
                </div>
              </div>
            ))}

            {/* Price */}
            <div className="bg-black-soft rounded-xl border border-gold-500/20 p-3">
              <p className="text-white/30 text-xs mb-1.5">Ücret</p>
              <p className="text-gold-500 font-bold text-lg">
                {formatPrice(appt.final_price, "TRY")}
              </p>
              {appt.discount_amount > 0 && (
                <p className="text-white/30 text-xs">İndirim: -{formatPrice(appt.discount_amount, "TRY")}</p>
              )}
            </div>
          </div>

          {/* Customer note */}
          {appt.customer_notes && (
            <div className="bg-black-soft rounded-xl border border-black-border p-3">
              <p className="text-white/30 text-xs mb-1.5">Müşteri Notu</p>
              <p className="text-white/70 text-sm">{appt.customer_notes}</p>
            </div>
          )}

          {/* Staff note */}
          <div>
            <label className="label">Personel Notu</label>
            <textarea
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              rows={3}
              placeholder="Randevuya not ekle..."
              className="input resize-none"
            />
            <button
              onClick={saveNote}
              disabled={loading || staffNote === appt.staff_notes}
              className="btn-ghost text-xs px-4 py-1.5 mt-2"
            >
              Kaydet
            </button>
          </div>

          {/* Status actions */}
          <div>
            <p className="label">Durum Güncelle</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.filter((s) => s.value !== appt.status).map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    disabled={loading}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                      "bg-black-soft border border-black-border hover:border-gold-500/40 transition-all",
                      s.color,
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

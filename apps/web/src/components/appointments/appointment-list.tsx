"use client";

import { format, parseISO, isToday, isTomorrow, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, User, Scissors, MoreVertical, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, minutesToDisplay } from "@nailstudio/shared";
import { wallTime } from "@/lib/datetime";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:     { label: "Bekliyor",       className: "status-pending" },
  confirmed:   { label: "Onaylandı",      className: "status-confirmed" },
  in_progress: { label: "Devam Ediyor",   className: "status-in_progress" },
  completed:   { label: "Tamamlandı",     className: "status-completed" },
  canceled:    { label: "İptal Edildi",   className: "status-canceled" },
  no_show:     { label: "Gelmedi",        className: "status-no_show" },
};

interface AppointmentListProps {
  appointments: any[];
  onAppointmentClick: (appt: any) => void;
}

export function AppointmentList({ appointments, onAppointmentClick }: AppointmentListProps) {
  // Group by date
  const grouped = appointments.reduce<Record<string, any[]>>((acc, appt) => {
    const date = appt.starts_at.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(appt);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Bugün";
    if (isTomorrow(date)) return "Yarın";
    if (isYesterday(date)) return "Dün";
    return format(date, "d MMMM yyyy, EEEE", { locale: tr });
  };

  if (appointments.length === 0) {
    return (
      <div className="card flex-1 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-white/10" />
          <p className="text-white/40 text-sm">Bu hafta randevu bulunamadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {sortedDates.map((dateStr) => (
        <div key={dateStr}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-white">
              {getDateLabel(dateStr)}
            </span>
            <div className="flex-1 h-px bg-black-border" />
            <span className="text-xs text-white/30">
              {grouped[dateStr].length} randevu
            </span>
          </div>

          {/* Appointments */}
          <div className="space-y-2">
            {grouped[dateStr].map((appt) => {
              const status = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
              return (
                <div
                  key={appt.id}
                  onClick={() => onAppointmentClick(appt)}
                  className="card border border-black-border hover:border-gold-500/30
                             cursor-pointer transition-all duration-150 hover:scale-[1.002]
                             flex items-center gap-4 py-4"
                >
                  {/* Time */}
                  <div className="text-center w-16 shrink-0">
                    <p className="text-white font-bold text-base">
                      {wallTime(appt.starts_at)}
                    </p>
                    <p className="text-white/30 text-xs">
                      {wallTime(appt.ends_at)}
                    </p>
                  </div>

                  {/* Staff color */}
                  <div
                    className="w-0.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: appt.staff?.color ?? "#C9A84C" }}
                  />

                  {/* Customer */}
                  <div className="flex items-center gap-3 w-48 shrink-0">
                    <div className="w-9 h-9 rounded-full bg-black-border flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white/60">
                        {appt.customer?.first_name?.charAt(0)}{appt.customer?.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {appt.customer?.first_name} {appt.customer?.last_name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-white/30" />
                        <p className="text-white/30 text-xs truncate">{appt.customer?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Scissors className="w-4 h-4 text-gold-500/60 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white/90 text-sm font-medium truncate">
                        {appt.service?.name}
                        {appt.appointment_services?.length > 1 && (
                          <span className="text-gold-500/80"> +{appt.appointment_services.length - 1}</span>
                        )}
                      </p>
                      <p className="text-white/30 text-xs">
                        {minutesToDisplay(appt.duration_minutes)}
                      </p>
                    </div>
                  </div>

                  {/* Staff */}
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: appt.staff?.color ?? "#C9A84C" }}
                    />
                    <p className="text-white/60 text-sm truncate">{appt.staff?.display_name}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right w-20 shrink-0">
                    <p className="text-gold-500 font-semibold text-sm">
                      {formatPrice(appt.final_price, "TRY")}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <span className={cn("badge", status.className)}>
                      {status.label}
                    </span>
                  </div>

                  {/* More */}
                  <button
                    className="text-white/20 hover:text-white/60 shrink-0 transition-colors"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

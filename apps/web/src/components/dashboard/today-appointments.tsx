"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, Phone, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { wallTime } from "@/lib/datetime";

const STATUS_STYLES: Record<string, string> = {
  pending: "status-pending",
  confirmed: "status-confirmed",
  in_progress: "status-in_progress",
  completed: "status-completed",
  canceled: "status-canceled",
  no_show: "status-no_show",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  canceled: "İptal",
  no_show: "Gelmedi",
};

interface TodayAppointmentsProps {
  appointments: any[];
}

export function TodayAppointments({ appointments }: TodayAppointmentsProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Bugünün Randevuları</h3>
        <span className="badge bg-gold-500/20 text-gold-500">
          {appointments.length} randevu
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Bugün randevu yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-black border border-black-border
                         hover:border-gold-500/30 transition-all duration-150 cursor-pointer group"
            >
              {/* Time */}
              <div className="text-center w-14 shrink-0">
                <p className="text-white font-semibold text-sm">
                  {wallTime(appointment.starts_at)}
                </p>
                <p className="text-white/30 text-xs">
                  {wallTime(appointment.ends_at)}
                </p>
              </div>

              {/* Staff color bar */}
              <div
                className="w-0.5 h-10 rounded-full shrink-0"
                style={{ backgroundColor: appointment.staff?.color ?? "#C9A84C" }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {appointment.customer?.first_name} {appointment.customer?.last_name}
                </p>
                <p className="text-white/40 text-xs truncate">
                  {appointment.service?.name} · {appointment.staff?.display_name}
                </p>
              </div>

              {/* Status */}
              <div className="shrink-0 flex items-center gap-2">
                <span className={cn("badge", STATUS_STYLES[appointment.status])}>
                  {STATUS_LABELS[appointment.status]}
                </span>
                <button className="text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

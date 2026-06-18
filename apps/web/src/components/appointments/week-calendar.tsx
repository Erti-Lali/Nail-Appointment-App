"use client";

import { useMemo, useState, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { wallTime, wallMinutes } from "@/lib/datetime";

const HOUR_START = 8;
const HOUR_END = 21;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const TOTAL_MIN = TOTAL_HOURS * 60;

const STAFF_W = 130; // left label column width (px)
const TRACK_MIN = 760; // min width of the time track → scrolls on small screens

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending:     { bg: "bg-[rgb(var(--ns-warning))]/15", border: "border-[rgb(var(--ns-warning))]/40", text: "text-[rgb(var(--ns-warning))]" },
  confirmed:   { bg: "bg-[rgb(var(--ns-success))]/15", border: "border-[rgb(var(--ns-success))]/40", text: "text-[rgb(var(--ns-success))]" },
  in_progress: { bg: "bg-[rgb(var(--ns-info))]/15",    border: "border-[rgb(var(--ns-info))]/40",    text: "text-[rgb(var(--ns-info))]" },
  completed:   { bg: "bg-[rgb(var(--ns-neutral))]/15", border: "border-[rgb(var(--ns-neutral))]/30", text: "text-[rgb(var(--ns-neutral))]" },
  canceled:    { bg: "bg-[rgb(var(--ns-danger))]/10",  border: "border-[rgb(var(--ns-danger))]/20",  text: "text-[rgb(var(--ns-danger))]" },
  no_show:     { bg: "bg-[rgb(var(--ns-noshow))]/10",  border: "border-[rgb(var(--ns-noshow))]/20",  text: "text-[rgb(var(--ns-noshow))]" },
};

interface WeekCalendarProps {
  appointments: any[];
  staff: any[];
  currentDate: string;
  onAppointmentClick: (appt: any) => void;
}

export function WeekCalendar({
  appointments,
  staff,
  currentDate,
  onAppointmentClick,
}: WeekCalendarProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(currentDate), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const weekKeys = weekDays.map((d) => format(d, "yyyy-MM-dd"));

  const [selectedDay, setSelectedDay] = useState(
    weekKeys.includes(todayStr) ? todayStr : weekKeys[0]
  );

  // Keep the selected day inside the visible week when the week changes.
  useEffect(() => {
    if (!weekKeys.includes(selectedDay)) {
      setSelectedDay(weekKeys.includes(todayStr) ? todayStr : weekKeys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const dayAppointments = appointments.filter(
    (a) => String(a.starts_at).slice(0, 10) === selectedDay
  );

  // Hour labels / gridlines (08:00 … 20:00 left → right)
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i);
  const xPct = (hour: number) => ((hour - HOUR_START) / TOTAL_HOURS) * 100;

  const leftPct = (ts: string) =>
    Math.max(((wallMinutes(ts) - HOUR_START * 60) / TOTAL_MIN) * 100, 0);
  const widthPct = (a: any) => {
    const dur =
      (new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000;
    return Math.max((dur / TOTAL_MIN) * 100, 0);
  };

  return (
    <div className="card flex-1 overflow-hidden flex flex-col p-0">
      {/* Day selector */}
      <div className="flex gap-1.5 p-3 border-b border-black-border overflow-x-auto shrink-0">
        {weekDays.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const isSel = key === selectedDay;
          const isToday = key === todayStr;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-lg text-center transition-all leading-tight",
                isSel ? "bg-gold-500 text-black" : "bg-black text-white/60 hover:text-white"
              )}
            >
              <span className="text-[10px] uppercase block">
                {format(d, "EEE", { locale: tr })}
              </span>
              <span className={cn("text-sm font-bold", isToday && !isSel && "text-gold-500")}>
                {format(d, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: STAFF_W + TRACK_MIN }}>
          {/* Time header (left → right) */}
          <div className="flex sticky top-0 z-20 bg-black-card border-b border-black-border">
            <div
              style={{ width: STAFF_W }}
              className="shrink-0 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/40"
            >
              Personel
            </div>
            <div className="relative flex-1 h-9">
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 border-l border-black-border/50"
                  style={{ left: `${xPct(h)}%` }}
                >
                  <span className="text-[10px] text-white/30 font-mono pl-1">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff rows */}
          {staff.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">Personel bulunamadı</div>
          ) : (
            staff.map((m) => {
              const rowAppts = dayAppointments.filter((a) => a.staff_id === m.id);
              return (
                <div key={m.id} className="flex border-b border-black-border/40 min-h-[64px]">
                  {/* Staff label */}
                  <div
                    style={{ width: STAFF_W }}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 border-r border-black-border bg-black-card"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-black text-xs font-bold shrink-0"
                      style={{ backgroundColor: m.color ?? "rgb(var(--ns-brand))" }}
                    >
                      {m.display_name?.charAt(0)}
                    </div>
                    <span className="text-xs text-white font-medium truncate">
                      {m.display_name}
                    </span>
                  </div>

                  {/* Time track */}
                  <div className="relative flex-1 my-1.5">
                    {/* gridlines */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute top-0 bottom-0 border-l border-black-border/20"
                        style={{ left: `${xPct(h)}%` }}
                      />
                    ))}
                    {/* appointments */}
                    {rowAppts.map((a) => {
                      const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.pending;
                      const extra = (a.appointment_services?.length ?? 1) - 1;
                      return (
                        <button
                          key={a.id}
                          onClick={() => onAppointmentClick(a)}
                          className={cn(
                            "absolute top-0 bottom-0 rounded-lg border text-left overflow-hidden px-2 py-1",
                            "hover:brightness-110 transition-all active:scale-[0.98] cursor-pointer",
                            sc.bg,
                            sc.border
                          )}
                          style={{ left: `${leftPct(a.starts_at)}%`, width: `${widthPct(a)}%`, minWidth: 64 }}
                        >
                          <p className={cn("text-[11px] font-semibold truncate leading-tight", sc.text)}>
                            {a.service?.name}
                            {extra > 0 && ` +${extra}`}
                          </p>
                          <p className="text-[10px] text-white/50 truncate leading-tight">
                            {wallTime(a.starts_at)} · {a.customer?.first_name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

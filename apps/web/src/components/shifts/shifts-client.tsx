"use client";

import { CalendarClock, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABELS, DAYS_ORDER } from "@nailstudio/shared";

interface ShiftsClientProps {
  staff: any[];
}

const TODAY_KEY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
  new Date().getDay()
];

// "09:00:00" -> "09:00"
function fmt(t?: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

function hoursFor(member: any, day: string) {
  const h = member.working_hours?.find((w: any) => w.day_of_week === day);
  if (!h || !h.is_working) return null;
  const start = fmt(h.start_time);
  const end = fmt(h.end_time);
  if (!start || !end) return null;
  return { start, end };
}

export function ShiftsClient({ staff }: ShiftsClientProps) {
  const todayLabel = DAY_LABELS[TODAY_KEY];
  const workingToday = staff.filter((m) => hoursFor(m, TODAY_KEY)).length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-gold-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-white leading-tight">{staff.length}</p>
            <p className="text-white/50 text-xs">Aktif Personel</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-white leading-tight">{workingToday}</p>
            <p className="text-white/50 text-xs truncate">Bugün vardiyada ({todayLabel})</p>
          </div>
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="card text-center py-16 text-white/30">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz aktif personel yok</p>
        </div>
      ) : (
        <>
          {/* ===== Desktop: weekly grid ===== */}
          <div className="card p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-black-border">
                    <th className="text-left text-xs font-semibold text-white/40 uppercase tracking-wide px-4 py-3 sticky left-0 bg-black-card z-10">
                      Personel
                    </th>
                    {DAYS_ORDER.map((day) => (
                      <th
                        key={day}
                        className={cn(
                          "text-center text-xs font-semibold uppercase tracking-wide px-2 py-3",
                          day === TODAY_KEY ? "text-gold-500" : "text-white/40"
                        )}
                      >
                        {DAY_LABELS[day].slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black-border">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-black/30 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-black-card z-10">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold text-sm shrink-0"
                            style={{ backgroundColor: member.color ?? "rgb(var(--ns-brand))" }}
                          >
                            {member.display_name.charAt(0)}
                          </div>
                          <span className="text-white text-sm font-medium whitespace-nowrap">
                            {member.display_name}
                          </span>
                        </div>
                      </td>
                      {DAYS_ORDER.map((day) => {
                        const h = hoursFor(member, day);
                        const isToday = day === TODAY_KEY;
                        return (
                          <td key={day} className={cn("px-2 py-3 text-center", isToday && "bg-gold-500/5")}>
                            {h ? (
                              <span
                                className={cn(
                                  "inline-block text-xs font-medium rounded-lg px-2 py-1 whitespace-nowrap",
                                  isToday ? "bg-gold-500/20 text-gold-500" : "bg-green-500/10 text-green-400"
                                )}
                              >
                                {h.start}–{h.end}
                              </span>
                            ) : (
                              <span className="text-white/20 text-xs">İzinli</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== Mobile: per-staff cards ===== */}
          <div className="space-y-3 md:hidden">
            {staff.map((member) => (
              <div key={member.id} className="card p-4">
                <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-black-border">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-black font-bold shrink-0"
                    style={{ backgroundColor: member.color ?? "rgb(var(--ns-brand))" }}
                  >
                    {member.display_name.charAt(0)}
                  </div>
                  <p className="text-white font-semibold text-sm truncate">{member.display_name}</p>
                </div>
                <div className="space-y-1.5">
                  {DAYS_ORDER.map((day) => {
                    const h = hoursFor(member, day);
                    const isToday = day === TODAY_KEY;
                    return (
                      <div
                        key={day}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2",
                          isToday ? "bg-gold-500/10" : "bg-black"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm flex items-center gap-1.5",
                            isToday ? "text-gold-500 font-medium" : "text-white/70"
                          )}
                        >
                          {DAY_LABELS[day]}
                          {isToday && <span className="text-[10px] bg-gold-500/20 px-1.5 py-0.5 rounded">Bugün</span>}
                        </span>
                        {h ? (
                          <span className="text-sm font-medium text-white flex items-center gap-1">
                            <Clock className="w-3 h-3 text-white/30" />
                            {h.start}–{h.end}
                          </span>
                        ) : (
                          <span className="text-white/25 text-xs">İzinli</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

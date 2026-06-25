"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addWeeks, subWeeks, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, List, ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekCalendar } from "./week-calendar";
import { AppointmentList } from "./appointment-list";
import { NewAppointmentModal } from "./new-appointment-modal";
import { AppointmentDetailModal } from "./appointment-detail-modal";

type View = "week" | "list";

interface AppointmentsClientProps {
  appointments: any[];
  staff: any[];
  services: any[];
  customers: any[];
  tenantId: string;
  initialView: string;
  initialDate: string;
}

export function AppointmentsClient({
  appointments: initialAppointments,
  staff,
  services,
  customers,
  tenantId,
  initialView,
  initialDate,
}: AppointmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>((initialView as View) ?? "week");
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterStaff, setFilterStaff] = useState<string | null>(null);

  // Keep the displayed appointments in sync with the data the page refetches
  // whenever the viewed week changes. Without this the list stays frozen on the
  // first-loaded week, so navigating weeks shows stale data and freshly created
  // appointments "disappear" after leaving and returning to the page.
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  // Dashboard hızlı işlem derin linki (?new=1) → yeni randevu modalını aç.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowNewModal(true);
      router.replace(`/appointments?view=${view}&date=${currentDate}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const navigateWeek = (direction: "prev" | "next") => {
    const date = new Date(currentDate);
    const newDate = direction === "next" ? addWeeks(date, 1) : subWeeks(date, 1);
    const formatted = format(newDate, "yyyy-MM-dd");
    setCurrentDate(formatted);
    router.replace(`/appointments?view=${view}&date=${formatted}`, { scroll: false });
  };

  const goToToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setCurrentDate(today);
    router.replace(`/appointments?view=${view}&date=${today}`, { scroll: false });
  };

  const switchView = (v: View) => {
    setView(v);
    router.replace(`/appointments?view=${v}&date=${currentDate}`, { scroll: false });
  };

  const filteredAppointments = filterStaff
    ? appointments.filter((a) => a.staff_id === filterStaff)
    : appointments;

  const weekLabel = (() => {
    const date = new Date(currentDate);
    const start = new Date(date);
    start.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // Monday
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${format(start, "d MMM", { locale: tr })} – ${format(end, "d MMM yyyy", { locale: tr })}`;
  })();

  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Week navigation */}
        <div className="flex items-center gap-1 bg-black-soft border border-black-border rounded-xl p-1">
          <button
            onClick={() => navigateWeek("prev")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black-border transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <span className="px-3 text-sm font-medium text-white min-w-[160px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => navigateWeek("next")}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black-border transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="btn-ghost text-sm px-4 py-2"
        >
          Bugün
        </button>

        {/* Staff filter */}
        <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
          <select
            value={filterStaff ?? ""}
            onChange={(e) => setFilterStaff(e.target.value || null)}
            className="bg-black-soft border border-black-border rounded-xl px-3 py-2 text-sm
                       text-white/70 outline-none focus:border-gold-500/50 cursor-pointer"
          >
            <option value="">Tüm Personel</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.display_name}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex items-center bg-black-soft border border-black-border rounded-xl p-1">
            <button
              onClick={() => switchView("week")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                view === "week" ? "bg-gold-500/20 text-gold-500" : "text-white/40 hover:text-white/70"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Takvim
            </button>
            <button
              onClick={() => switchView("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                view === "list" ? "bg-gold-500/20 text-gold-500" : "text-white/40 hover:text-white/70"
              )}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="btn-gold flex items-center gap-2 text-sm py-2"
          >
            <Plus className="w-4 h-4" />
            Yeni Randevu
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "week" ? (
        <WeekCalendar
          appointments={filteredAppointments}
          staff={staff}
          currentDate={currentDate}
          onAppointmentClick={setSelectedAppointment}
        />
      ) : (
        <AppointmentList
          appointments={filteredAppointments}
          onAppointmentClick={setSelectedAppointment}
        />
      )}

      {/* Modals */}
      {showNewModal && (
        <NewAppointmentModal
          staff={staff}
          services={services}
          customers={customers}
          appointments={appointments}
          tenantId={tenantId}
          onClose={() => setShowNewModal(false)}
          onSuccess={(newAppointment) => {
            setAppointments((prev) => [...prev, newAppointment]);
            setShowNewModal(false);
          }}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onStatusChange={(id, status) => {
            setAppointments((prev) =>
              prev.map((a) => (a.id === id ? { ...a, status } : a))
            );
            setSelectedAppointment((prev: any) => ({ ...prev, status }));
          }}
        />
      )}
    </div>
  );
}

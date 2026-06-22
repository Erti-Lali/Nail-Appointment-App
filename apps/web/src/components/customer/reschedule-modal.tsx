"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addDays, addMinutes, parseISO, isBefore } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const SLOT_STEP = 30;
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const toHHMM = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

interface WorkingHours { start: string; end: string; breakStart: string | null; breakEnd: string | null }

export function RescheduleModal({
  appointment,
  token,
  onClose,
  onSuccess,
}: {
  appointment: any;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const duration = appointment.duration_minutes ?? 60;
  const staffId = appointment.staff_id;

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ id?: string; starts_at: string; ends_at: string }[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [onLeave, setOnLeave] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { key: format(d, "yyyy-MM-dd"), day: format(d, "EEE", { locale: tr }), num: format(d, "d") };
  });

  useEffect(() => {
    if (!staffId) return;
    setLoadingSlots(true);
    setTime(null);
    fetch(`/api/book?staffId=${staffId}&date=${date}`)
      .then((r) => r.json())
      .then((d) => { setBusy(d.busy ?? []); setWorkingHours(d.workingHours ?? null); setOnLeave(!!d.onLeave); })
      .catch(() => { setBusy([]); setWorkingHours(null); setOnLeave(false); })
      .finally(() => setLoadingSlots(false));
  }, [staffId, date]);

  const slots = useMemo(() => {
    if (!workingHours || duration === 0) return [] as string[];
    const open = toMin(workingHours.start);
    const close = toMin(workingHours.end);
    const bStart = workingHours.breakStart ? toMin(workingHours.breakStart) : null;
    const bEnd = workingHours.breakEnd ? toMin(workingHours.breakEnd) : null;
    const out: string[] = [];
    for (let t = open; t + duration <= close; t += SLOT_STEP) {
      const end = t + duration;
      if (bStart != null && bEnd != null && t < bEnd && bStart < end) continue;
      out.push(toHHMM(t));
    }
    return out;
  }, [workingHours, duration]);

  const slotTaken = (slot: string) => {
    const start = parseISO(`${date}T${slot}:00`);
    const end = addMinutes(start, duration);
    if (isBefore(start, new Date())) return true;
    return busy.some((b) => {
      if (b.id && b.id === appointment.id) return false; // ignore the appointment being moved
      const bs = parseISO(b.starts_at);
      const be = parseISO(b.ends_at);
      return isBefore(start, be) && isBefore(bs, end);
    });
  };

  const availableSlots = slots.filter((s) => !slotTaken(s));

  const submit = async () => {
    if (!time) return;
    setSaving(true);
    const res = await fetch("/api/customer/appointments/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ appointmentId: appointment.id, newStartsAt: `${date}T${time}:00` }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error(d.error ?? "Randevu güncellenemedi");
      if (res.status === 409) { // slot taken meanwhile — refresh availability
        fetch(`/api/book?staffId=${staffId}&date=${date}`).then((r) => r.json()).then((x) => setBusy(x.busy ?? []));
        setTime(null);
      }
      return;
    }
    toast.success("Randevunuz güncellendi");
    onSuccess();
    onClose();
  };

  return (
    <Modal title="Tarih / Saat Değiştir" onClose={onClose} size="lg"
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>Vazgeç</Button>
          <Button className="flex-1" onClick={submit} disabled={!time} loading={saving}>Kaydet</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Date strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {dates.map((d) => (
            <button key={d.key} onClick={() => setDate(d.key)}
              className={cn("shrink-0 w-14 py-2.5 rounded-2xl border flex flex-col items-center transition-all",
                date === d.key ? "bg-brand border-brand text-surface" : "bg-surface border-line text-ink hover:border-brand/40")}>
              <span className={cn("text-[10px] uppercase", date === d.key ? "text-surface/80" : "text-ink-subtle")}>{d.day}</span>
              <span className="text-lg font-bold">{d.num}</span>
            </button>
          ))}
        </div>

        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Müsait saatler</p>
        {loadingSlots ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-brand animate-spin" /></div>
        ) : onLeave ? (
          <div className="text-center py-8 text-ink-subtle text-sm">Personel bu tarihte izinli. Lütfen başka bir gün seçin.</div>
        ) : !workingHours ? (
          <div className="text-center py-8 text-ink-subtle text-sm">Personel bu gün çalışmıyor. Lütfen başka bir gün seçin.</div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8 text-ink-subtle text-sm">Bu tarihte uygun saat kalmadı. Lütfen başka bir gün seçin.</div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot) => {
              const taken = slotTaken(slot);
              return (
                <button key={slot} disabled={taken} onClick={() => setTime(slot)}
                  className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all",
                    taken ? "bg-[rgb(var(--ns-slot-taken-bg))] border-transparent text-[rgb(var(--ns-slot-taken-fg))] line-through cursor-not-allowed"
                      : time === slot ? "bg-brand border-brand text-surface"
                      : "bg-surface border-line text-ink hover:border-brand/40")}>
                  {slot}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

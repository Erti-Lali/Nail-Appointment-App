"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addDays, addMinutes, parseISO, isBefore } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Check, ChevronLeft, ChevronRight, Clock, MapPin, Instagram,
  Loader2, CalendarCheck, Phone,
} from "lucide-react";
import { formatPrice, minutesToDisplay, isValidPhone } from "@nailstudio/shared";
import { cn } from "@/lib/utils";

const STEPS = ["Hizmet", "Personel", "Tarih & Saat", "Bilgiler"];

const SLOT_STEP = 30; // minutes between slots
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const toHHMM = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

interface WorkingHours { start: string; end: string; breakStart: string | null; breakEnd: string | null }

interface Props {
  tenant: any;
  categories: any[];
  services: any[];
  staff: any[];
}

export function BookingClient({ tenant, categories, services, staff }: Props) {
  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ starts_at: string; ends_at: string }[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [onLeave, setOnLeave] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServices = services.filter((s) => serviceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price ?? 0), 0);
  const member = staff.find((s) => s.id === staffId);
  const toggleService = (id: string) =>
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { key: format(d, "yyyy-MM-dd"), day: format(d, "EEE", { locale: tr }), num: format(d, "d") };
  });

  // Fetch busy ranges + working window when staff or date changes
  useEffect(() => {
    if (step !== 2 || !staffId) return;
    setLoadingSlots(true);
    setTime(null);
    fetch(`/api/book?staffId=${staffId}&date=${date}`)
      .then((r) => r.json())
      .then((d) => { setBusy(d.busy ?? []); setWorkingHours(d.workingHours ?? null); setOnLeave(!!d.onLeave); })
      .catch(() => { setBusy([]); setWorkingHours(null); setOnLeave(false); })
      .finally(() => setLoadingSlots(false));
  }, [step, staffId, date]);

  // Slots generated from the staff's working window for the selected day.
  // A slot must fit the whole appointment within working hours and not overlap a break.
  const slots = useMemo(() => {
    if (!workingHours || totalDuration === 0) return [] as string[];
    const open = toMin(workingHours.start);
    const close = toMin(workingHours.end);
    const bStart = workingHours.breakStart ? toMin(workingHours.breakStart) : null;
    const bEnd = workingHours.breakEnd ? toMin(workingHours.breakEnd) : null;
    const out: string[] = [];
    for (let t = open; t + totalDuration <= close; t += SLOT_STEP) {
      const end = t + totalDuration;
      // skip if appointment overlaps the break window
      if (bStart != null && bEnd != null && t < bEnd && bStart < end) continue;
      out.push(toHHMM(t));
    }
    return out;
  }, [workingHours, totalDuration]);

  const slotTaken = (slot: string) => {
    if (totalDuration === 0) return false;
    const start = parseISO(`${date}T${slot}:00`);
    const end = addMinutes(start, totalDuration);
    // past slots for today
    if (isBefore(start, new Date())) return true;
    return busy.some((b) => {
      const bs = parseISO(b.starts_at);
      const be = parseISO(b.ends_at);
      return isBefore(start, be) && isBefore(bs, end);
    });
  };

  const grouped = useMemo(() => {
    return categories
      .map((c) => ({ ...c, items: services.filter((s) => s.category_id === c.id) }))
      .filter((c) => c.items.length > 0);
  }, [categories, services]);
  const uncategorized = services.filter((s) => !categories.find((c) => c.id === s.category_id));

  const canProceed =
    (step === 0 && serviceIds.length > 0) ||
    (step === 1 && !!staffId) ||
    (step === 2 && !!time) ||
    (step === 3 && form.firstName.trim() !== "" && isValidPhone(form.phone));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          serviceIds,
          staffId,
          startsAt: `${date}T${time}:00`,
          customer: {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            email: form.email,
          },
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Randevu oluşturulamadı");
      } else {
        setDone(true);
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
    setSubmitting(false);
  };

  const currency = tenant.currency ?? "TRY";

  // ─── Success screen ───────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="bg-surface border border-line rounded-3xl shadow-xl max-w-md w-full p-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-5">
            <CalendarCheck className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Randevu Talebiniz Alındı! 🎉</h1>
          <p className="text-ink-muted mt-2">
            {tenant.name} sizinle en kısa sürede iletişime geçecek.
          </p>
          <div className="bg-brand-soft border border-brand/20 rounded-2xl p-4 mt-6 text-left space-y-2 text-sm">
            <Row label="Hizmetler" value={selectedServices.map((s) => s.name).join(", ")} />
            <Row label="Personel" value={member?.display_name} />
            <Row label="Tarih" value={format(parseISO(date), "d MMMM yyyy, EEEE", { locale: tr })} />
            <Row label="Saat" value={time ?? "-"} />
            <Row label="Ücret" value={formatPrice(totalPrice, currency)} />
          </div>
          <p className="text-ink-subtle text-xs mt-5">
            Randevu durumu onaylandığında bilgilendirileceksiniz.
          </p>
          <a href="/hesabim/kayit" className="mt-5 inline-flex items-center justify-center gap-2 w-full border border-brand/40 hover:border-brand text-brand font-semibold py-2.5 rounded-xl transition-all">
            Randevularımı takip et
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-surface border-b border-line">
        <div className="max-w-lg mx-auto px-5 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-white text-xl font-bold overflow-hidden shrink-0">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover" />
            ) : (
              tenant.name?.[0] ?? "💅"
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-ink text-lg truncate">{tenant.name}</h1>
            <div className="flex items-center gap-3 text-xs text-ink-subtle">
              {tenant.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tenant.city}</span>}
              {tenant.instagram_handle && (
                <span className="flex items-center gap-1"><Instagram className="w-3 h-3" />@{tenant.instagram_handle}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-5 pt-5">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  i < step ? "bg-brand text-white"
                    : i === step ? "bg-brand text-white ring-4 ring-brand/20"
                    : "bg-line text-ink-subtle"
                )}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={cn("text-[10px] font-medium", i === step ? "text-brand" : "text-ink-subtle")}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1 mb-5 rounded transition-all", i < step ? "bg-brand" : "bg-line")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5 py-5 pb-28">
        {/* Step 0: Service */}
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-bold text-ink text-lg">Hizmet seçin</h2>
              <span className="text-xs text-ink-subtle shrink-0">Birden fazla seçebilirsiniz</span>
            </div>
            {selectedServices.length > 0 && (
              <div className="bg-brand-soft border border-brand/20 rounded-xl px-3 py-2 flex justify-between items-center text-sm">
                <span className="text-ink-muted">{selectedServices.length} hizmet · {minutesToDisplay(totalDuration)}</span>
                <span className="font-bold text-brand">{formatPrice(totalPrice, currency)}</span>
              </div>
            )}
            {grouped.map((cat) => (
              <div key={cat.id}>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>{cat.icon ?? "✨"}</span>{cat.name}
                </p>
                <div className="space-y-2">
                  {cat.items.map((s: any) => (
                    <ServiceCard key={s.id} service={s} currency={currency} active={serviceIds.includes(s.id)} onSelect={() => toggleService(s.id)} />
                  ))}
                </div>
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div className="space-y-2">
                {uncategorized.map((s) => (
                  <ServiceCard key={s.id} service={s} currency={currency} active={serviceIds.includes(s.id)} onSelect={() => toggleService(s.id)} />
                ))}
              </div>
            )}
            {services.length === 0 && <Empty text="Henüz hizmet eklenmemiş." />}
          </div>
        )}

        {/* Step 1: Staff */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="font-bold text-ink text-lg">Personel seçin</h2>
            {staff.map((m) => (
              <button key={m.id} onClick={() => setStaffId(m.id)}
                className={cn("w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all bg-surface",
                  staffId === m.id ? "border-brand ring-2 ring-brand/15" : "border-line hover:border-brand/40")}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: `${m.color ?? "#DB5E9B"}20`, color: m.color ?? "#DB5E9B" }}>
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt={m.display_name} className="w-full h-full object-cover" />
                  ) : (m.display_name?.[0] ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink">{m.display_name}</p>
                  {m.specialties?.length > 0 && (
                    <p className="text-xs text-ink-subtle truncate">{m.specialties.join(", ")}</p>
                  )}
                </div>
                {staffId === m.id && <Check className="w-5 h-5 text-brand shrink-0" />}
              </button>
            ))}
            {staff.length === 0 && <Empty text="Online randevuya açık personel yok." />}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="font-bold text-ink text-lg">Tarih ve saat</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {dates.map((d) => (
                <button key={d.key} onClick={() => { setDate(d.key); setTime(null); }}
                  className={cn("shrink-0 w-14 py-2.5 rounded-2xl border flex flex-col items-center transition-all",
                    date === d.key ? "bg-brand border-brand text-white" : "bg-surface border-line text-ink hover:border-brand/40")}>
                  <span className={cn("text-[10px] uppercase", date === d.key ? "text-white/80" : "text-ink-subtle")}>{d.day}</span>
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
            ) : slots.filter((s) => !slotTaken(s)).length === 0 ? (
              <div className="text-center py-8 text-ink-subtle text-sm">Bu tarihte uygun saat kalmadı. Lütfen başka bir gün seçin.</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const taken = slotTaken(slot);
                  return (
                    <button key={slot} disabled={taken} onClick={() => setTime(slot)}
                      className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all",
                        taken ? "bg-[rgb(var(--ns-slot-taken-bg))] border-transparent text-[rgb(var(--ns-slot-taken-fg))] line-through cursor-not-allowed"
                          : time === slot ? "bg-brand border-brand text-white"
                          : "bg-surface border-line text-ink hover:border-brand/40")}>
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer info */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-bold text-ink text-lg">İletişim bilgileriniz</h2>

            <div className="bg-brand-soft border border-brand/20 rounded-2xl p-4 space-y-2 text-sm">
              <Row label="Hizmetler" value={selectedServices.map((s) => s.name).join(", ")} />
              <Row label="Personel" value={member?.display_name} />
              <Row label="Tarih" value={format(parseISO(date), "d MMM yyyy, EEE", { locale: tr })} />
              <Row label="Saat" value={time ?? "-"} />
              <Row label="Süre" value={minutesToDisplay(totalDuration)} />
              <Row label="Ücret" value={formatPrice(totalPrice, currency)} accent />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad *" value={form.firstName} onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} placeholder="Ayşe" />
              <Field label="Soyad" value={form.lastName} onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} placeholder="Yılmaz" />
            </div>
            <Field label="Telefon *" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="05XX XXX XX XX" type="tel" icon={<Phone className="w-4 h-4" />} />
            <Field label="E-posta" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="ornek@email.com" type="email" />
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1.5">Not (opsiyonel)</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                placeholder="Özel istekleriniz..."
                className="w-full bg-surface-soft border border-line rounded-xl px-4 py-2.5 text-ink placeholder:text-ink-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-surface border-t border-line p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="w-12 h-12 rounded-xl border border-line flex items-center justify-center text-ink-muted hover:border-brand transition-all shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button
            disabled={!canProceed || submitting}
            onClick={() => { if (step < 3) setStep((s) => s + 1); else submit(); }}
            className="flex-1 h-12 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {step === 3 ? "Randevuyu Onayla" : "Devam Et"}
                {step < 3 && <ChevronRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service, currency, active, onSelect }: { service: any; currency: string; active: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className={cn("w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all bg-surface",
        active ? "border-brand ring-2 ring-brand/15" : "border-line hover:border-brand/40")}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink">{service.name}</p>
        <p className="text-xs text-ink-subtle flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />{minutesToDisplay(service.duration_minutes)}
          {service.description && <span className="truncate"> · {service.description}</span>}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className="font-bold text-brand">{formatPrice(service.price, currency)}</p>
        <span className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
          active ? "border-brand bg-brand" : "border-[rgb(var(--ns-line-strong))]")}>
          {active && <Check className="w-3 h-3 text-white" />}
        </span>
      </div>
    </button>
  );
}

function Row({ label, value, accent }: { label: string; value?: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-subtle">{label}</span>
      <span className={cn(accent ? "text-brand font-bold" : "text-ink font-medium")}>{value ?? "-"}</span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-muted mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">{icon}</span>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={cn("w-full bg-surface-soft border border-line rounded-xl px-4 py-2.5 text-ink placeholder:text-ink-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all", icon && "pl-9")} />
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-12 text-ink-subtle">{text}</div>;
}

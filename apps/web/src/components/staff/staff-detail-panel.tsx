"use client";

import { useState } from "react";
import { X, Clock, Scissors, ToggleLeft, ToggleRight, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAY_LABELS, DAYS_ORDER } from "@nailstudio/shared";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface StaffDetailPanelProps {
  staff: any;
  services: any[];
  tenantId: string;
  onClose: () => void;
  onUpdate: (staff: any) => void;
}

const TABS = ["Çalışma Saatleri", "Hizmetler", "Genel"];

export function StaffDetailPanel({ staff, services, tenantId, onClose, onUpdate }: StaffDetailPanelProps) {
  const supabase = createClient();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [workingHours, setWorkingHours] = useState<any[]>(
    DAYS_ORDER.map((day) => {
      const existing = staff.working_hours?.find((h: any) => h.day_of_week === day);
      return existing ?? {
        day_of_week: day,
        is_working: day !== "sunday",
        start_time: "09:00",
        end_time: "18:00",
        break_start: "12:00",
        break_end: "13:00",
      };
    })
  );

  const [assignedServices, setAssignedServices] = useState<string[]>(
    staff.service_staff?.map((ss: any) => ss.service_id) ?? []
  );

  const [settings, setSettings] = useState({
    accepts_online_booking: staff.accepts_online_booking,
    booking_buffer_minutes: staff.booking_buffer_minutes ?? 0,
    is_active: staff.is_active,
  });

  // Tüm sekmelerdeki değişiklikleri tek seferde kaydeder (çalışma saatleri +
  // hizmetler + genel ayarlar). Tek "Kaydet" butonu bunu çağırır.
  const saveAll = async () => {
    setLoading(true);

    // 1) Çalışma saatleri (upsert)
    const whRows = workingHours.map((h) => ({ ...h, staff_id: staff.id, tenant_id: tenantId }));
    const { error: whErr } = await supabase
      .from("staff_working_hours")
      .upsert(whRows, { onConflict: "staff_id,day_of_week" });
    if (whErr) { toast.error("Kaydedilemedi", { description: whErr.message }); setLoading(false); return; }

    // 2) Hizmet atamaları (sil + ekle)
    const { error: delErr } = await supabase.from("service_staff").delete().eq("staff_id", staff.id);
    if (delErr) { toast.error("Kaydedilemedi", { description: delErr.message }); setLoading(false); return; }
    if (assignedServices.length > 0) {
      const { error: insErr } = await supabase.from("service_staff").insert(
        assignedServices.map((sid) => ({ service_id: sid, staff_id: staff.id }))
      );
      if (insErr) { toast.error("Kaydedilemedi", { description: insErr.message }); setLoading(false); return; }
    }

    // 3) Genel ayarlar
    const { data, error: setErr } = await supabase
      .from("staff").update(settings).eq("id", staff.id).select().single();
    if (setErr) { toast.error("Kaydedilemedi", { description: setErr.message }); setLoading(false); return; }

    onUpdate({
      ...staff,
      ...(data ?? {}),
      working_hours: workingHours,
      service_staff: assignedServices.map((sid) => ({ service_id: sid })),
    });
    toast.success("Değişiklikler kaydedildi");
    setLoading(false);
  };

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black-border shrink-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold shrink-0"
          style={{ backgroundColor: staff.color ?? "#C9A84C" }}
        >
          {staff.display_name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">{staff.display_name}</p>
          <p className="text-white/40 text-xs capitalize">{staff.role}</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 shrink-0">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
              tab === i ? "bg-gold-500/20 text-gold-500" : "text-white/40 hover:text-white/70"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Tab 0: Working hours */}
        {tab === 0 && (
          <>
            {workingHours.map((day, i) => (
              <div
                key={day.day_of_week}
                className={cn(
                  "p-3 rounded-xl border transition-colors",
                  day.is_working ? "border-black-border bg-black" : "border-black-border/50 bg-black/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => setWorkingHours((prev) => prev.map((d, j) => j === i ? { ...d, is_working: !d.is_working } : d))}
                    className="shrink-0"
                  >
                    {day.is_working
                      ? <ToggleRight className="w-6 h-6 text-gold-500" />
                      : <ToggleLeft className="w-6 h-6 text-white/30" />
                    }
                  </button>
                  <span className={cn("text-sm font-medium w-24", day.is_working ? "text-white" : "text-white/30")}>
                    {DAY_LABELS[day.day_of_week]}
                  </span>
                  {day.is_working && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={day.start_time}
                        onChange={(e) => setWorkingHours((prev) => prev.map((d, j) => j === i ? { ...d, start_time: e.target.value } : d))}
                        className="bg-black-soft border border-black-border rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-gold-500/50"
                      />
                      <span className="text-white/30 text-xs">–</span>
                      <input
                        type="time"
                        value={day.end_time}
                        onChange={(e) => setWorkingHours((prev) => prev.map((d, j) => j === i ? { ...d, end_time: e.target.value } : d))}
                        className="bg-black-soft border border-black-border rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-gold-500/50"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Tab 1: Services */}
        {tab === 1 && (
          <>
            <p className="text-white/40 text-xs">Bu personelin yapabileceği hizmetleri seçin:</p>
            {services.map((service) => {
              const assigned = assignedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => setAssignedServices((prev) =>
                    assigned ? prev.filter((id) => id !== service.id) : [...prev, service.id]
                  )}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                    assigned
                      ? "border-gold-500/40 bg-gold-500/10"
                      : "border-black-border bg-black hover:border-black-muted"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                    assigned ? "border-gold-500 bg-gold-500" : "border-white/20"
                  )}>
                    {assigned && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", assigned ? "text-white" : "text-white/70")}>
                      {service.name}
                    </p>
                    <p className="text-white/30 text-xs">
                      {service.duration_minutes} dk · ₺{service.price}
                    </p>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {/* Tab 2: Settings */}
        {tab === 2 && (
          <>
            {[
              {
                label: "Online Randevu",
                desc: "Müşteriler bu personeli online seçebilir",
                key: "accepts_online_booking",
                type: "toggle",
              },
              {
                label: "Aktif",
                desc: "Personel aktif olarak çalışıyor",
                key: "is_active",
                type: "toggle",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-black rounded-xl border border-black-border">
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-white/30 text-xs mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                >
                  {settings[item.key as keyof typeof settings]
                    ? <ToggleRight className="w-8 h-8 text-gold-500" />
                    : <ToggleLeft className="w-8 h-8 text-white/30" />
                  }
                </button>
              </div>
            ))}

            <div className="p-4 bg-black rounded-xl border border-black-border">
              <p className="text-white text-sm font-medium mb-1">Randevular Arası Süre</p>
              <p className="text-white/30 text-xs mb-3">Randevular arasında otomatik boş bırakılacak dakika</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.booking_buffer_minutes}
                  onChange={(e) => setSettings((prev) => ({ ...prev, booking_buffer_minutes: Number(e.target.value) }))}
                  className="input w-24 text-center"
                  min={0}
                  max={60}
                  step={5}
                />
                <span className="text-white/40 text-sm">dakika</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tek kaydet — tüm sekmelerdeki değişiklikleri birlikte kaydeder */}
      <div className="shrink-0 pt-4 mt-2 border-t border-black-border">
        <button
          onClick={saveAll}
          disabled={loading}
          className="btn-gold w-full flex items-center justify-center gap-2 text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Kaydet</>}
        </button>
      </div>
    </div>
  );
}

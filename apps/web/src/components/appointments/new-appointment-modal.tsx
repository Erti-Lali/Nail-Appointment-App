"use client";

import { useState } from "react";
import { X, Loader2, Search, UserPlus, Check } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { wallMinutes } from "@/lib/datetime";

type BookedVia = "admin" | "phone" | "walk_in" | "instagram";

const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${min}`;
});

interface NewAppointmentModalProps {
  staff: any[];
  services: any[];
  customers: any[];
  appointments?: any[];
  tenantId: string;
  onClose: () => void;
  onSuccess: (appointment: any) => void;
}

export function NewAppointmentModal({ staff, services, customers, appointments = [], tenantId, onClose, onSuccess }: NewAppointmentModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [localCustomers, setLocalCustomers] = useState<any[]>(customers);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ first_name: "", last_name: "", phone: "" });
  const [form, setForm] = useState({
    customer_id: "",
    staff_id: "",
    service_ids: [] as string[],
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    customer_notes: "",
    booked_via: "admin" as BookedVia,
  });

  const selectedServices = services.filter((s) => form.service_ids.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price ?? 0), 0);

  // Conflict check: same staff cannot have an overlapping appointment.
  // (Same time + different staff is allowed.) The DB enforces this too; this is
  // for instant feedback before submitting.
  const newStart = (() => { const [h, m] = form.time.split(":").map(Number); return h * 60 + m; })();
  const newEnd = newStart + (totalDuration || 0);
  const hasConflict = !!form.staff_id && totalDuration > 0 && appointments.some((a) =>
    a.staff_id === form.staff_id &&
    a.status !== "canceled" && a.status !== "no_show" &&
    String(a.starts_at).slice(0, 10) === form.date &&
    newStart < wallMinutes(a.ends_at) && wallMinutes(a.starts_at) < newEnd
  );
  const selectedCustomer = localCustomers.find((c) => c.id === form.customer_id);
  const filteredCustomers = localCustomers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.phone?.includes(q);
  }).slice(0, 8);

  const createCustomer = async () => {
    if (!newCust.first_name.trim() || !newCust.phone.trim()) {
      toast.error("Ad ve telefon zorunlu");
      return;
    }
    setCreatingCustomer(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        first_name: newCust.first_name.trim(),
        last_name: newCust.last_name.trim(),
        phone: newCust.phone.trim(),
      })
      .select()
      .single();
    if (error) {
      toast.error("Müşteri eklenemedi", { description: error.message });
    } else {
      setLocalCustomers((prev) => [data, ...prev]);
      setForm((f) => ({ ...f, customer_id: data.id }));
      setAddingCustomer(false);
      setNewCust({ first_name: "", last_name: "", phone: "" });
      toast.success("Müşteri eklendi ve seçildi");
    }
    setCreatingCustomer(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.staff_id || form.service_ids.length === 0) {
      toast.error("Lütfen müşteri, en az bir hizmet ve personel seçin");
      return;
    }
    if (hasConflict) {
      toast.error("Bu personelin o saatte zaten randevusu var", { description: "Farklı saat ya da personel seç." });
      return;
    }
    setLoading(true);
    const starts_at = `${form.date}T${form.time}:00`;
    const duration = totalDuration || 60;
    const ends_at = format(addMinutes(new Date(starts_at), duration), "yyyy-MM-dd'T'HH:mm:ss");
    const price = totalPrice;

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        customer_id: form.customer_id,
        staff_id: form.staff_id,
        service_id: form.service_ids[0], // primary service (NOT NULL)
        starts_at, ends_at,
        duration_minutes: duration,
        price, final_price: price, discount_amount: 0, deposit_paid: 0,
        status: "confirmed",
        booked_via: form.booked_via,
        customer_notes: form.customer_notes || null,
      })
      .select("*, customer:customers(id,first_name,last_name,phone), staff:staff(id,display_name,color), service:services(id,name,duration_minutes,price)")
      .single();

    if (error) {
      const isConflict = error.code === "23P01" || /exclu|overlap|conflict/i.test(error.message ?? "");
      toast.error(
        isConflict ? "Bu personelin o saatte zaten randevusu var" : "Randevu oluşturulamadı",
        { description: isConflict ? "Farklı saat ya da personel seç." : error.message }
      );
      setLoading(false);
      return;
    }

    // Record every selected service in the junction table
    const rows = selectedServices.map((s) => ({
      appointment_id: data.id,
      service_id: s.id,
      tenant_id: tenantId,
      price: Number(s.price ?? 0),
      duration_minutes: s.duration_minutes ?? 0,
    }));
    const { error: svcErr } = await supabase.from("appointment_services").insert(rows);
    if (svcErr) {
      toast.error("Randevu oluştu ama hizmet listesi kaydedilemedi", { description: svcErr.message });
    } else {
      toast.success("Randevu oluşturuldu!");
    }

    onSuccess({
      ...data,
      appointment_services: selectedServices.map((s) => ({
        service_id: s.id,
        service: { id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes },
      })),
    });
    setLoading(false);
  };

  const inputCls = "w-full bg-surface-soft border border-line rounded-xl px-4 py-2.5 text-ink placeholder:text-ink-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all";
  const labelCls = "block text-sm font-medium text-ink-muted mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-semibold text-ink">Yeni Randevu</h2>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-130px)]">
          {/* Customer */}
          <div className="relative">
            <label className={labelCls}>Müşteri *</label>
            {selectedCustomer ? (
              <div className="flex items-center gap-3 p-3 bg-brand-soft border border-brand/30 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                  <span className="text-brand text-xs font-bold">{selectedCustomer.first_name[0]}{selectedCustomer.last_name?.[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-ink text-sm font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                  <p className="text-ink-subtle text-xs">{selectedCustomer.phone}</p>
                </div>
                <button type="button" onClick={() => setForm((f) => ({ ...f, customer_id: "" }))} className="text-ink-subtle hover:text-ink"><X className="w-4 h-4" /></button>
              </div>
            ) : addingCustomer ? (
              <div className="space-y-2 p-3 bg-brand-soft border border-brand/30 rounded-xl">
                <div className="grid grid-cols-2 gap-2">
                  <input value={newCust.first_name} onChange={(e) => setNewCust((c) => ({ ...c, first_name: e.target.value }))} placeholder="Ad *" className={inputCls} />
                  <input value={newCust.last_name} onChange={(e) => setNewCust((c) => ({ ...c, last_name: e.target.value }))} placeholder="Soyad" className={inputCls} />
                </div>
                <input value={newCust.phone} onChange={(e) => setNewCust((c) => ({ ...c, phone: e.target.value }))} placeholder="Telefon *" type="tel" className={inputCls} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAddingCustomer(false)} className="flex-1 border border-line text-ink-muted hover:border-brand text-sm font-medium py-2 rounded-lg transition-all bg-surface">İptal</button>
                  <button type="button" onClick={createCustomer} disabled={creatingCustomer} className="flex-1 bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {creatingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle ve Seç"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
                <input type="text" value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerList(true); }}
                  onFocus={() => setShowCustomerList(true)}
                  placeholder="İsim veya telefon ara..."
                  className={inputCls + " pl-9"} />
                {showCustomerList && customerSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-xl overflow-hidden z-10 shadow-lg">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-ink-subtle text-sm text-center py-4">Müşteri bulunamadı</p>
                    ) : filteredCustomers.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => { setForm((f) => ({ ...f, customer_id: c.id })); setCustomerSearch(""); setShowCustomerList(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-soft text-left border-b border-line last:border-0">
                        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center">
                          <span className="text-brand text-xs font-bold">{c.first_name[0]}{c.last_name?.[0]}</span>
                        </div>
                        <div>
                          <p className="text-ink text-sm">{c.first_name} {c.last_name}</p>
                          <p className="text-ink-subtle text-xs">{c.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button type="button"
                  onClick={() => { setAddingCustomer(true); setNewCust((c) => ({ ...c, first_name: customerSearch.trim() || c.first_name })); setShowCustomerList(false); }}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 text-sm text-brand hover:text-brand-dark font-medium border border-dashed border-brand/40 hover:border-brand rounded-xl py-2 transition-all">
                  <UserPlus className="w-4 h-4" /> Yeni müşteri ekle
                </button>
              </div>
            )}
          </div>

          {/* Services (multi-select) */}
          <div>
            <label className={labelCls}>
              Hizmetler *{" "}
              {selectedServices.length > 0 && (
                <span className="text-ink-subtle font-normal">({selectedServices.length} seçili)</span>
              )}
            </label>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-line divide-y divide-line">
              {services.length === 0 ? (
                <p className="text-ink-subtle text-sm text-center py-4">Hizmet bulunamadı</p>
              ) : services.map((s) => {
                const checked = form.service_ids.includes(s.id);
                return (
                  <button key={s.id} type="button"
                    onClick={() => setForm((f) => ({
                      ...f,
                      service_ids: checked
                        ? f.service_ids.filter((id) => id !== s.id)
                        : [...f.service_ids, s.id],
                    }))}
                    className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      checked ? "bg-brand-soft" : "hover:bg-surface-soft")}>
                    <span className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0",
                      checked ? "border-brand bg-brand" : "border-[rgb(var(--ns-line-strong))]")}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1 min-w-0 text-sm text-ink truncate">{s.name}</span>
                    <span className="text-xs text-ink-subtle shrink-0 whitespace-nowrap">{s.duration_minutes} dk · ₺{s.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Staff */}
          <div>
            <label className={labelCls}>Personel *</label>
            <select value={form.staff_id} onChange={(e) => setForm((f) => ({ ...f, staff_id: e.target.value }))} className={inputCls + " cursor-pointer"} required>
              <option value="">Personel seçin...</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tarih *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} min={format(new Date(), "yyyy-MM-dd")} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Saat *</label>
              <select value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className={inputCls + " cursor-pointer"}>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Summary */}
          {selectedServices.length > 0 && (
            <div className="bg-brand-soft border border-brand/20 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-ink-subtle">Hizmet</span><span className="text-ink">{selectedServices.length} adet</span></div>
              <div className="flex justify-between"><span className="text-ink-subtle">Toplam Süre</span><span className="text-ink">{totalDuration} dk</span></div>
              <div className="flex justify-between"><span className="text-ink-subtle">Toplam Ücret</span><span className="text-brand font-semibold">₺{totalPrice}</span></div>
              {form.time && <div className="flex justify-between"><span className="text-ink-subtle">Bitiş</span><span className="text-ink">{format(addMinutes(new Date(`${form.date}T${form.time}:00`), totalDuration || 0), "HH:mm")}</span></div>}
            </div>
          )}

          {/* Conflict warning */}
          {hasConflict && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
              ⚠️ Bu personelin seçtiğin saatte zaten bir randevusu var. Farklı bir saat ya da personel seç.
            </div>
          )}

          {/* Source */}
          <div>
            <label className={labelCls}>Randevu Kaynağı</label>
            <div className="flex gap-2 flex-wrap">
              {(["admin", "phone", "walk_in", "instagram"] as BookedVia[]).map((src) => {
                const labels: Record<BookedVia, string> = { admin: "Panel", phone: "Telefon", walk_in: "Yüz Yüze", instagram: "Instagram" };
                return (
                  <button key={src} type="button" onClick={() => setForm((f) => ({ ...f, booked_via: src }))}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      form.booked_via === src ? "bg-brand/10 border-brand/40 text-brand" : "border-line text-ink-subtle hover:border-brand/30 hover:text-brand")}>
                    {labels[src]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Müşteri Notu</label>
            <textarea value={form.customer_notes} onChange={(e) => setForm((f) => ({ ...f, customer_notes: e.target.value }))}
              rows={2} placeholder="Özel istek veya not..." className={inputCls + " resize-none"} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-line text-ink-muted hover:border-brand font-medium py-2.5 rounded-xl transition-all bg-surface">İptal</button>
            <button type="submit" disabled={loading || hasConflict} className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Randevu Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

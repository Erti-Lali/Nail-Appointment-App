"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ServiceFormModalProps {
  tenantId: string;
  categories: any[];
  editingService: any | null;
  onClose: () => void;
  onSuccess: (service: any) => void;
}

export function ServiceFormModal({ tenantId, categories, editingService, onClose, onSuccess }: ServiceFormModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category_id: editingService?.category_id ?? categories[0]?.id ?? "",
    name: editingService?.name ?? "",
    description: editingService?.description ?? "",
    duration_minutes: editingService?.duration_minutes ?? 60,
    price: editingService?.price ?? 0,
    price_max: editingService?.price_max ?? "",
    deposit_required: editingService?.deposit_required ?? false,
    deposit_amount: editingService?.deposit_amount ?? "",
    is_featured: editingService?.is_featured ?? false,
    is_active: editingService?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      tenant_id: tenantId,
      category_id: form.category_id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration_minutes: Number(form.duration_minutes),
      price: Number(form.price),
      price_max: form.price_max ? Number(form.price_max) : null,
      deposit_required: form.deposit_required,
      deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
      is_featured: form.is_featured,
      is_active: form.is_active,
    };

    let data, error;

    if (editingService) {
      ({ data, error } = await supabase.from("services").update(payload).eq("id", editingService.id)
        .select("*, category:service_categories(name, color, icon)").single());
    } else {
      ({ data, error } = await supabase.from("services").insert(payload)
        .select("*, category:service_categories(name, color, icon)").single());
    }

    if (error) {
      toast.error("Hizmet kaydedilemedi", { description: error.message });
    } else {
      toast.success(editingService ? "Hizmet güncellendi" : "Hizmet eklendi");
      onSuccess(data);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#00000066] backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-black-soft border border-black-border rounded-2xl shadow-card overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-black-border">
          <h2 className="text-white font-semibold">{editingService ? "Hizmet Düzenle" : "Yeni Hizmet"}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="label">Kategori *</label>
            <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="input appearance-none cursor-pointer" required>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Hizmet Adı *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input" placeholder="Kalıcı Oje" required />
          </div>

          <div>
            <label className="label">Açıklama</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input resize-none" rows={2} placeholder="Kısa açıklama..." />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Süre (dk) *</label>
              <input type="number" value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className="input" min={5} step={5} required />
            </div>
            <div>
              <label className="label">Fiyat (₺) *</label>
              <input type="number" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="input" min={0} required />
            </div>
            <div>
              <label className="label">Maks. Fiyat</label>
              <input type="number" value={form.price_max}
                onChange={(e) => setForm((f) => ({ ...f, price_max: e.target.value }))}
                className="input" min={0} placeholder="İsteğe bağlı" />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {[
              { key: "is_featured", label: "Öne Çıkar" },
              { key: "is_active", label: "Aktif" },
              { key: "deposit_required", label: "Depozito İste" },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[item.key as keyof typeof form] as boolean}
                  onChange={(e) => setForm((f) => ({ ...f, [item.key]: e.target.checked }))}
                  className="accent-gold-500 w-4 h-4" />
                <span className="text-white/70 text-sm">{item.label}</span>
              </label>
            ))}
          </div>

          {form.deposit_required && (
            <div>
              <label className="label">Depozito Tutarı (₺)</label>
              <input type="number" value={form.deposit_amount}
                onChange={(e) => setForm((f) => ({ ...f, deposit_amount: e.target.value }))}
                className="input" min={0} />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">İptal</button>
            <button type="submit" disabled={loading} className="btn-gold flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingService ? "Güncelle" : "Ekle")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

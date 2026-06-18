"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Modal, Field, Input, Textarea, Button, inputClass } from "@/components/ui";

interface Props {
  tenantId: string;
  categories: any[];
  editingService: any | null;
  onClose: () => void;
  onSuccess: (service: any) => void;
}

const TOGGLES = [
  { key: "is_featured", label: "Öne Çıkar" },
  { key: "is_active", label: "Aktif" },
  { key: "deposit_required", label: "Depozito İste" },
] as const;

export function ServiceFormModal({ tenantId, categories, editingService, onClose, onSuccess }: Props) {
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
  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
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

    const q = editingService
      ? supabase.from("services").update(payload).eq("id", editingService.id)
      : supabase.from("services").insert(payload);
    const { data, error } = await q.select("*, category:service_categories(name, color, icon)").single();

    if (error) toast.error("Hizmet kaydedilemedi", { description: error.message });
    else { toast.success(editingService ? "Hizmet güncellendi" : "Hizmet eklendi"); onSuccess(data); }
    setLoading(false);
  };

  return (
    <Modal
      title={editingService ? "Hizmet Düzenle" : "Yeni Hizmet"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>İptal</Button>
          <Button type="submit" form="service-form" className="flex-1" loading={loading}>{editingService ? "Güncelle" : "Ekle"}</Button>
        </>
      }
    >
      <form id="service-form" onSubmit={submit} className="space-y-4">
        <Field label="Kategori *">
          <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={inputClass + " cursor-pointer"} required>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Hizmet Adı *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Kalıcı Oje" required /></Field>
        <Field label="Açıklama"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Kısa açıklama..." /></Field>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Süre (dk) *"><Input type="number" value={form.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} min={5} step={5} required /></Field>
          <Field label="Fiyat (₺) *"><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} min={0} required /></Field>
          <Field label="Maks. Fiyat"><Input type="number" value={form.price_max} onChange={(e) => set("price_max", e.target.value)} min={0} placeholder="İsteğe bağlı" /></Field>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {TOGGLES.map((item) => (
            <label key={item.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[item.key] as boolean} onChange={(e) => set(item.key, e.target.checked)} className="accent-brand w-4 h-4" />
              <span className="text-ink-muted text-sm">{item.label}</span>
            </label>
          ))}
        </div>
        {form.deposit_required && (
          <Field label="Depozito Tutarı (₺)"><Input type="number" value={form.deposit_amount} onChange={(e) => set("deposit_amount", e.target.value)} min={0} /></Field>
        )}
      </form>
    </Modal>
  );
}

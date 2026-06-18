"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Modal, Field, Input, Textarea, Button, inputClass } from "@/components/ui";
import type { Enum, Tables } from "@/lib/database.types";

interface Props {
  tenantId: string;
  onClose: () => void;
  onSuccess: (customer: Tables<"customers">) => void;
}

export function NewCustomerModal({ tenantId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", gender: "", birth_date: "", notes: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        gender: (form.gender || null) as Enum<"gender_type"> | null,
        birth_date: form.birth_date || null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();
    if (error) toast.error("Müşteri eklenemedi", { description: error.message });
    else if (data) { toast.success("Müşteri eklendi!"); onSuccess(data); }
    setLoading(false);
  };

  return (
    <Modal
      title="Yeni Müşteri"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>İptal</Button>
          <Button type="submit" form="new-customer-form" className="flex-1" loading={loading}>Müşteri Ekle</Button>
        </>
      }
    >
      <form id="new-customer-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ad *"><Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="Ayşe" required /></Field>
          <Field label="Soyad *"><Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} placeholder="Yılmaz" required /></Field>
        </div>
        <Field label="Telefon *"><Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="05xx xxx xx xx" required /></Field>
        <Field label="E-posta"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ornek@mail.com" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cinsiyet">
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputClass + " cursor-pointer"}>
              <option value="">Seçin</option>
              <option value="female">Kadın</option>
              <option value="male">Erkek</option>
              <option value="other">Diğer</option>
            </select>
          </Field>
          <Field label="Doğum Tarihi"><Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} /></Field>
        </div>
        <Field label="Notlar"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Özel not veya hatırlatıcı..." /></Field>
      </form>
    </Modal>
  );
}

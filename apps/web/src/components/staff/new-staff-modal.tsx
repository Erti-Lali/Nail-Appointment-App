"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Modal, Field, Input, Textarea, Button, inputClass } from "@/components/ui";
import { STAFF_ROLE_LABELS } from "@/lib/constants";
import type { Enum } from "@/lib/database.types";

const COLORS = ["#C9A84C", "#EC4899", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];

interface Props {
  tenantId: string;
  onClose: () => void;
  onSuccess: (staff: any) => void;
}

export function NewStaffModal({ tenantId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ display_name: "", email: "", role: "technician", color: "#C9A84C", bio: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Demo personel: gerçek bir auth hesabı oluşturmadan eklenir (profile_id null).
    const { data: staffData, error } = await supabase
      .from("staff")
      .insert({
        tenant_id: tenantId,
        profile_id: null,
        display_name: form.display_name,
        role: form.role as Enum<"staff_role">,
        color: form.color,
        bio: form.bio || null,
        is_active: true,
        accepts_online_booking: true,
        booking_buffer_minutes: 0,
      })
      .select()
      .single();

    if (error) toast.error("Personel eklenemedi", { description: error.message });
    else { toast.success(`${form.display_name} eklendi!`); onSuccess({ ...staffData, working_hours: [], service_staff: [] }); }
    setLoading(false);
  };

  return (
    <Modal
      title="Yeni Personel"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>İptal</Button>
          <Button type="submit" form="new-staff-form" className="flex-1" loading={loading}>Ekle</Button>
        </>
      }
    >
      <form id="new-staff-form" onSubmit={submit} className="space-y-4">
        <Field label="Görünen İsim *"><Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="Ayşe Hanım" required /></Field>
        <Field label="E-posta *"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ayse@studiomail.com" required /></Field>
        <Field label="Rol">
          <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass + " cursor-pointer"}>
            {(Object.keys(STAFF_ROLE_LABELS) as Enum<"staff_role">[]).map((r) => (
              <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
            ))}
          </select>
        </Field>
        <Field label="Takvim Rengi">
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((color) => (
              <button key={color} type="button" onClick={() => set("color", color)}
                className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                style={{ backgroundColor: color, outline: form.color === color ? "2px solid rgb(var(--ns-brand))" : "none", outlineOffset: "2px" }} />
            ))}
          </div>
        </Field>
        <Field label="Bio"><Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={2} placeholder="Kısa tanıtım metni..." /></Field>
      </form>
    </Modal>
  );
}

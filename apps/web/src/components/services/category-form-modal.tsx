"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Modal, Field, Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/database.types";

const ICONS = ["💅", "✨", "💎", "🌸", "🎨", "🦋", "🌟", "💫", "🔮", "🩷"];
const PRESET_COLORS = ["#C9A84C", "#EC4899", "#8B5CF6", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];

interface Props {
  tenantId: string;
  onClose: () => void;
  onSuccess: (cat: Tables<"service_categories">) => void;
}

export function CategoryFormModal({ tenantId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "💅", color: "#C9A84C" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("service_categories")
      .insert({ tenant_id: tenantId, name: form.name.trim(), icon: form.icon, color: form.color })
      .select().single();
    if (error) toast.error("Kategori eklenemedi", { description: error.message });
    else if (data) { toast.success("Kategori eklendi"); onSuccess(data); }
    setLoading(false);
  };

  return (
    <Modal
      title="Yeni Kategori"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>İptal</Button>
          <Button type="submit" form="category-form" className="flex-1" loading={loading}>Ekle</Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-4">
        <Field label="Kategori Adı *"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Manikür" required /></Field>
        <Field label="İkon">
          <div className="flex gap-2 flex-wrap">
            {ICONS.map((icon) => (
              <button key={icon} type="button" onClick={() => setForm((f) => ({ ...f, icon }))}
                className={cn("w-10 h-10 rounded-lg text-xl transition-all hover:scale-110",
                  form.icon === icon ? "bg-brand/20 outline outline-2 outline-brand" : "bg-surface-soft")}>
                {icon}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Renk">
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button key={color} type="button" onClick={() => setForm((f) => ({ ...f, color }))}
                className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                style={{ backgroundColor: color, outline: form.color === color ? "2px solid rgb(var(--ns-brand))" : "none", outlineOffset: "2px" }} />
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}

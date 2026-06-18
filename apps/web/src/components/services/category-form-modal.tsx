"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const ICONS = ["💅", "✨", "💎", "🌸", "🎨", "🦋", "🌟", "💫", "🔮", "🩷"];
const PRESET_COLORS = ["#C9A84C", "#EC4899", "#8B5CF6", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];

interface CategoryFormModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: (cat: any) => void;
}

export function CategoryFormModal({ tenantId, onClose, onSuccess }: CategoryFormModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "💅", color: "#C9A84C" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("service_categories")
      .insert({ tenant_id: tenantId, name: form.name.trim(), icon: form.icon, color: form.color })
      .select().single();
    if (error) toast.error("Kategori eklenemedi");
    else { toast.success("Kategori eklendi"); onSuccess(data); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#00000066] backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-black-soft border border-black-border rounded-2xl shadow-card overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-black-border">
          <h2 className="text-white font-semibold">Yeni Kategori</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Kategori Adı *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input" placeholder="Manikür" required />
          </div>
          <div>
            <label className="label">İkon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((icon) => (
                <button key={icon} type="button" onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`w-10 h-10 rounded-lg text-xl transition-all hover:scale-110 ${form.icon === icon ? "bg-gold-500/30 outline outline-2 outline-gold-500" : "bg-black-border"}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Renk</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setForm((f) => ({ ...f, color }))}
                  className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                  style={{ backgroundColor: color, outline: form.color === color ? "2px solid white" : "none", outlineOffset: "2px" }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">İptal</button>
            <button type="submit" disabled={loading} className="btn-gold flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

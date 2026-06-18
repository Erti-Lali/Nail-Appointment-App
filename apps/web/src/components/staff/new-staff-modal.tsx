"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Enum } from "@/lib/database.types";

const COLORS = ["#C9A84C", "#EC4899", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];

interface NewStaffModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: (staff: any) => void;
}

export function NewStaffModal({ tenantId, onClose, onSuccess }: NewStaffModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    role: "technician",
    color: "#C9A84C",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Demo personel: gerçek bir auth hesabı oluşturmadan eklenir.
    // staff.profile_id nullable olduğu için null bırakılır (rastgele UUID
    // foreign key ihlaline yol açıyordu). Gerçek hesap bağlama daha sonra
    // Admin API / Edge Function ile yapılır.
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

    if (error) {
      toast.error("Personel eklenemedi", { description: error.message });
    } else {
      toast.success(`${form.display_name} eklendi!`);
      onSuccess({ ...staffData, working_hours: [], service_staff: [] });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#00000066] backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-black-soft border border-black-border rounded-2xl shadow-card overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-black-border">
          <h2 className="text-white font-semibold">Yeni Personel</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Görünen İsim *</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              className="input"
              placeholder="Ayşe Hanım"
              required
            />
          </div>

          <div>
            <label className="label">E-posta *</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input"
              type="email"
              placeholder="ayse@studiomail.com"
              required
            />
          </div>

          <div>
            <label className="label">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="input appearance-none cursor-pointer"
            >
              <option value="technician">Teknisyen</option>
              <option value="manager">Yönetici</option>
              <option value="receptionist">Resepsiyon</option>
              <option value="owner">Sahip</option>
            </select>
          </div>

          <div>
            <label className="label">Takvim Rengi</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    outline: form.color === color ? `2px solid white` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="input resize-none"
              rows={2}
              placeholder="Kısa tanıtım metni..."
            />
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

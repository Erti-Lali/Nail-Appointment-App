"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Phone, Mail, Calendar, Star, TrendingUp,
  Edit2, Scissors, Clock, MessageSquare, AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { formatDate, formatPrice, minutesToDisplay } from "@nailstudio/shared";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  pending:     "status-pending",
  confirmed:   "status-confirmed",
  in_progress: "status-in_progress",
  completed:   "status-completed",
  canceled:    "status-canceled",
  no_show:     "status-no_show",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor", confirmed: "Onaylandı", in_progress: "Devam Ediyor",
  completed: "Tamamlandı", canceled: "İptal", no_show: "Gelmedi",
};

interface CustomerDetailClientProps {
  customer: any;
  appointments: any[];
}

export function CustomerDetailClient({ customer, appointments }: CustomerDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(customer.notes ?? "");

  const saveNote = async () => {
    const { error } = await supabase
      .from("customers")
      .update({ notes: note })
      .eq("id", customer.id);
    if (error) toast.error("Not kaydedilemedi");
    else { toast.success("Not kaydedildi"); setEditingNote(false); }
  };

  const completedAppts = appointments.filter((a) => a.status === "completed");

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Müşteriler
      </button>

      {/* Header */}
      <div className="card flex items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gold-500/20 flex items-center justify-center shrink-0 border-2 border-gold-500/30">
          <span className="text-gold-500 text-2xl font-bold">
            {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {customer.first_name} {customer.last_name}
              </h1>
              <p className="text-white/40 text-sm mt-1">
                Müşteri · {formatDate(customer.created_at, "d MMMM yyyy")} tarihinden beri
              </p>
            </div>
            <button className="btn-ghost text-sm flex items-center gap-2 py-2">
              <Edit2 className="w-3.5 h-3.5" />
              Düzenle
            </button>
          </div>

          {/* Contact */}
          <div className="flex flex-wrap gap-4 mt-4">
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-white/60 hover:text-gold-500 transition-colors text-sm">
              <Phone className="w-4 h-4" />
              {customer.phone}
            </a>
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-white/60 hover:text-gold-500 transition-colors text-sm">
                <Mail className="w-4 h-4" />
                {customer.email}
              </a>
            )}
            {customer.birth_date && (
              <span className="flex items-center gap-2 text-white/60 text-sm">
                <Calendar className="w-4 h-4" />
                {formatDate(customer.birth_date, "d MMMM")}
              </span>
            )}
          </div>

          {/* Tags */}
          {customer.tags?.length > 0 && (
            <div className="flex gap-2 mt-3">
              {customer.tags.map((tag: string) => (
                <span key={tag} className="badge bg-gold-500/10 text-gold-500/80">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Toplam Ziyaret", value: customer.total_visits, icon: Calendar, color: "text-blue-400" },
          { label: "Toplam Harcama", value: formatPrice(customer.total_spent, "TRY"), icon: TrendingUp, color: "text-gold-500" },
          { label: "Sadakat Puanı", value: customer.loyalty_points, icon: Star, color: "text-amber-400" },
          { label: "Ort. Harcama", value: customer.total_visits > 0 ? formatPrice(customer.total_spent / customer.total_visits, "TRY") : "—", icon: TrendingUp, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-xs">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Appointments */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Randevu Geçmişi</h3>
            <span className="badge bg-gold-500/20 text-gold-500">{appointments.length}</span>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-10 text-white/20">
              <Scissors className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Henüz randevu yok</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {appointments.map((appt) => (
                <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-black border border-black-border hover:border-black-muted transition-colors">
                  <div
                    className="w-0.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: appt.staff?.color ?? "#C9A84C" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{appt.service?.name}</p>
                    <p className="text-white/30 text-xs">
                      {format(parseISO(appt.starts_at), "d MMM yyyy, HH:mm", { locale: tr })} · {appt.staff?.display_name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gold-500 text-sm font-medium">{formatPrice(appt.final_price, "TRY")}</p>
                    <span className={cn("badge text-[10px]", STATUS_STYLES[appt.status])}>
                      {STATUS_LABELS[appt.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes & Actions */}
        <div className="space-y-4">
          {/* Note */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">Notlar</h3>
              <button
                onClick={() => setEditingNote(!editingNote)}
                className="text-white/30 hover:text-gold-500 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {editingNote ? (
              <>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input resize-none text-sm"
                  rows={4}
                  placeholder="Müşteri notu ekle..."
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditingNote(false)} className="btn-ghost flex-1 text-xs py-1.5">
                    Vazgeç
                  </button>
                  <button onClick={saveNote} className="btn-gold flex-1 text-xs py-1.5">
                    Kaydet
                  </button>
                </div>
              </>
            ) : (
              <p className="text-white/50 text-sm">
                {note || "Henüz not eklenmemiş"}
              </p>
            )}
          </div>

          {/* Quick actions */}
          <div className="card space-y-2">
            <h3 className="font-semibold text-white text-sm mb-3">Hızlı İşlemler</h3>
            {[
              { icon: Calendar, label: "Randevu Oluştur", href: `/appointments?customer=${customer.id}` },
              { icon: MessageSquare, label: "SMS Gönder", href: `/notifications/sms?customer=${customer.id}` },
              { icon: AlertCircle, label: "Kara Listeye Al", danger: true },
            ].map((action) => (
              <button
                key={action.label}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm text-left",
                  action.danger
                    ? "text-red-400/70 hover:bg-red-500/10"
                    : "text-white/60 hover:bg-black-border"
                )}
              >
                <action.icon className="w-4 h-4 shrink-0" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

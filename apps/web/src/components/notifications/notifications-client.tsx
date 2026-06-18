"use client";

import { useState } from "react";
import {
  Bell, Mail, Smartphone, MessageSquare, Send, X, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { formatDateTime } from "@nailstudio/shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CHANNEL_META: Record<string, { icon: any; label: string }> = {
  sms: { icon: Smartphone, label: "SMS" },
  email: { icon: Mail, label: "E-posta" },
  push: { icon: MessageSquare, label: "Push" },
  whatsapp: { icon: MessageSquare, label: "WhatsApp" },
};

export function NotificationsClient({ history, status }: { history: any[]; status: any }) {
  const [showCompose, setShowCompose] = useState(false);

  const cards = [
    { id: "sms", icon: Smartphone, label: "SMS", desc: "Netgsm entegrasyonu", on: status.sms },
    { id: "email", icon: Mail, label: "E-posta", desc: "Resend entegrasyonu", on: status.email },
    { id: "push", icon: MessageSquare, label: "Push", desc: "Mobil bildirimler", on: status.push },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#1A0A14]">Bildirimler</h1>
          <p className="text-[#9CA3AF] mt-1">SMS, e-posta ve push bildirimleri</p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="bg-[#DB5E9B] hover:bg-[#C84B88] text-white font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
          <Send className="w-4 h-4" /> Bildirim Gönder
        </button>
      </div>

      {/* Channel status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.id} className="card border border-[#F3E0EB]">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", c.on ? "bg-[#DB5E9B]/10" : "bg-[#FEF0F5]")}>
                <c.icon className={cn("w-4 h-4", c.on ? "text-[#DB5E9B]" : "text-[#9CA3AF]")} />
              </div>
              <span className={cn("text-xs font-medium px-2 py-1 rounded-full",
                c.on ? "bg-green-100 text-green-700" : "bg-[#F3E0EB] text-[#9CA3AF]")}>
                {c.on ? "Bağlı" : "Yapılandırılmadı"}
              </span>
            </div>
            <div className="font-semibold text-[#1A0A14]">{c.label}</div>
            <div className="text-[#9CA3AF] text-sm mt-1">{c.desc}</div>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card border border-[#F3E0EB] p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F3E0EB]">
          <h2 className="font-semibold text-[#1A0A14]">Bildirim Geçmişi</h2>
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="w-12 h-12 text-[#DB5E9B]/20 mb-3" />
            <p className="text-[#9CA3AF]">Henüz bildirim gönderilmemiş</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3E0EB]">
            {history.map((n) => {
              const meta = CHANNEL_META[n.channel] ?? { icon: Bell, label: n.channel };
              const Icon = meta.icon;
              const failed = !!n.failed_at;
              return (
                <div key={n.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#FEF0F5] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#DB5E9B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#1A0A14] text-sm truncate">{n.title}</p>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F3E0EB] text-[#6B1A45]">{meta.label}</span>
                    </div>
                    <p className="text-[#9CA3AF] text-xs mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[#D9A8C2] text-[11px] mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                  <div className="shrink-0 pt-1">
                    {failed ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCompose && <ComposeModal status={status} onClose={() => setShowCompose(false)} />}
    </div>
  );
}

function ComposeModal({ status, onClose }: { status: any; onClose: () => void }) {
  const [channel, setChannel] = useState<"sms" | "email">(status.sms ? "sms" : "email");
  const [form, setForm] = useState({ to: "", title: "", message: "" });
  const [sending, setSending] = useState(false);

  const inputCls = "w-full bg-[#FEF0F5] border border-[#F3E0EB] rounded-xl px-4 py-2.5 text-[#1A0A14] placeholder:text-[#9CA3AF] outline-none focus:border-[#DB5E9B] focus:ring-2 focus:ring-[#DB5E9B]/20 transition-all";
  const labelCls = "block text-sm font-medium text-[#6B1A45] mb-1.5";

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.to.trim() || !form.message.trim()) return toast.error("Alıcı ve mesaj gerekli");
    setSending(true);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, to: form.to, title: form.title, message: form.message }),
      });
      const data = await res.json();
      if (!res.ok) toast.error("Gönderilemedi", { description: data.error });
      else { toast.success("Bildirim gönderildi"); onClose(); }
    } catch {
      toast.error("Bağlantı hatası");
    }
    setSending(false);
  };

  const channelOn = channel === "sms" ? status.sms : status.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#00000066] backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#FFFFFF] border border-[#F3E0EB] rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3E0EB]">
          <h2 className="font-semibold text-[#1A0A14]">Bildirim Gönder</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1A0A14]"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={send} className="p-5 space-y-4">
          <div className="flex gap-2">
            {(["sms", "email"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setChannel(c)}
                className={cn("flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                  channel === c ? "bg-[#DB5E9B]/10 border-[#DB5E9B]/40 text-[#DB5E9B]" : "border-[#F3E0EB] text-[#9CA3AF]")}>
                {c === "sms" ? "SMS" : "E-posta"}
              </button>
            ))}
          </div>

          {!channelOn && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-3 py-2">
              Bu kanal henüz yapılandırılmadı. Göndermek için sunucu ortam değişkenlerini ekleyin
              ({channel === "sms" ? "NETGSM_USERNAME / NETGSM_PASSWORD" : "RESEND_API_KEY"}).
            </div>
          )}

          <div>
            <label className={labelCls}>{channel === "sms" ? "Telefon" : "E-posta"} *</label>
            <input className={inputCls} value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
              placeholder={channel === "sms" ? "05XX XXX XX XX" : "ornek@email.com"} />
          </div>
          {channel === "email" && (
            <div>
              <label className={labelCls}>Konu</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Randevu hatırlatması" />
            </div>
          )}
          <div>
            <label className={labelCls}>Mesaj *</label>
            <textarea rows={4} className={inputCls + " resize-none"} value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Mesajınızı yazın..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-[#F3E0EB] text-[#6B1A45] hover:border-[#DB5E9B] font-medium py-2.5 rounded-xl bg-[#FFFFFF]">İptal</button>
            <button type="submit" disabled={sending} className="flex-1 bg-[#DB5E9B] hover:bg-[#C84B88] text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Gönder</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

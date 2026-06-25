"use client";

import { useState } from "react";
import {
  Store, Clock, CreditCard, Shield, Loader2, Check,
  ChevronRight, Instagram, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@nailstudio/shared";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "studio" | "appointment" | "subscription" | "security";

const TABS: { id: Tab; icon: any; label: string; desc: string }[] = [
  { id: "studio", icon: Store, label: "Stüdyo Bilgileri", desc: "İsim, iletişim, adres" },
  { id: "appointment", icon: Clock, label: "Randevu Ayarları", desc: "Süre, aralık, iptal politikası" },
  { id: "subscription", icon: CreditCard, label: "Abonelik", desc: "Plan ve ödeme bilgileri" },
  { id: "security", icon: Shield, label: "Güvenlik", desc: "Şifre değiştirme" },
];

const inputCls = "w-full bg-surface-soft border border-line rounded-xl px-4 py-2.5 text-ink placeholder:text-ink-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all";
const labelCls = "block text-sm font-medium text-ink-muted mb-1.5";

export function SettingsClient({ user, profile, tenant, subscription }: any) {
  const [tab, setTab] = useState<Tab>("studio");

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Ayarlar</h1>
        <p className="text-ink-subtle mt-1">Hesap ve stüdyo ayarları</p>
      </div>

      {/* Profile card */}
      <div className="card border border-line flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center text-white font-bold text-xl">
          {profile?.first_name?.[0] ?? "?"}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-ink truncate">{profile?.first_name} {profile?.last_name}</div>
          <div className="text-ink-subtle text-sm truncate">{user?.email}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-auto shrink-0 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-red-500 border border-line hover:border-red-300 px-3 sm:px-4 py-2 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Çıkış Yap</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Tab nav */}
        <div className="space-y-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                tab === t.id ? "bg-brand-soft border-brand/40" : "bg-surface border-line hover:border-brand/30")}>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                tab === t.id ? "bg-brand/15" : "bg-surface-soft")}>
                <t.icon className={cn("w-4 h-4", tab === t.id ? "text-brand" : "text-ink-subtle")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("font-semibold text-sm", tab === t.id ? "text-brand" : "text-ink")}>{t.label}</div>
                <div className="text-ink-subtle text-xs truncate">{t.desc}</div>
              </div>
              <ChevronRight className={cn("w-4 h-4 shrink-0", tab === t.id ? "text-brand" : "text-[rgb(var(--ns-slot-taken-fg))]")} />
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {tab === "studio" && <StudioForm tenant={tenant} />}
          {tab === "appointment" && <AppointmentForm tenant={tenant} />}
          {tab === "subscription" && <SubscriptionView subscription={subscription} />}
          {tab === "security" && <SecurityForm email={user?.email} />}
        </div>
      </div>
    </div>
  );
}

// ─── Studio info ──────────────────────────────────────────
function StudioForm({ tenant }: { tenant: any }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: tenant?.name ?? "",
    slug: tenant?.slug ?? "",
    phone: tenant?.phone ?? "",
    email: tenant?.email ?? "",
    address: tenant?.address ?? "",
    city: tenant?.city ?? "",
    description: tenant?.description ?? "",
    instagram_handle: tenant?.instagram_handle ?? "",
    google_maps_url: tenant?.google_maps_url ?? "",
  });

  const set = (k: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // URL slug: küçük harf, boşluk → tire, geçersiz karakterleri at
  const setSlug = (e: any) =>
    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, "") }));

  const save = async () => {
    if (!tenant?.id) return toast.error("Stüdyo bağlı değil");
    if (!form.name.trim()) return toast.error("Stüdyo adı zorunlu");
    const slug = form.slug.trim().replace(/^-+|-+$/g, "");
    if (!slug) return toast.error("URL adresi (slug) zorunlu");
    setSaving(true);
    const { error } = await supabase.from("tenants").update({
      name: form.name.trim(),
      slug,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      description: form.description.trim() || null,
      instagram_handle: form.instagram_handle.trim().replace(/^@/, "") || null,
      google_maps_url: form.google_maps_url.trim() || null,
    }).eq("id", tenant.id);
    setSaving(false);
    if (error) toast.error("Kaydedilemedi", { description: error.message });
    else toast.success("Stüdyo bilgileri güncellendi");
  };

  return (
    <Section title="Stüdyo Bilgileri" onSave={save} saving={saving}>
      <div>
        <label className={labelCls}>Stüdyo Adı *</label>
        <input className={inputCls} value={form.name} onChange={set("name")} placeholder="NailStudio 101" />
      </div>
      <div>
        <label className={labelCls}>URL Adresi (slug) *</label>
        <input className={inputCls} value={form.slug} onChange={setSlug} placeholder="nailstudio101" />
        <p className="text-ink-subtle text-xs mt-1">
          Randevu sayfanız: <span className="text-brand font-medium">nailstudio101.com/book/{form.slug || "..."}</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Telefon</label>
          <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="0212 XXX XX XX" />
        </div>
        <div>
          <label className={labelCls}>E-posta</label>
          <input className={inputCls} value={form.email} onChange={set("email")} placeholder="studio@email.com" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Adres</label>
        <input className={inputCls} value={form.address} onChange={set("address")} placeholder="Cadde, sokak, no" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Şehir</label>
          <input className={inputCls} value={form.city} onChange={set("city")} placeholder="İstanbul" />
        </div>
        <div>
          <label className={labelCls}>Instagram</label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
            <input className={inputCls + " pl-9"} value={form.instagram_handle} onChange={set("instagram_handle")} placeholder="kullaniciadi" />
          </div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Google Maps Bağlantısı</label>
        <input className={inputCls} value={form.google_maps_url} onChange={set("google_maps_url")} placeholder="https://maps.google.com/..." />
      </div>
      <div>
        <label className={labelCls}>Açıklama</label>
        <textarea className={inputCls + " min-h-[96px] resize-y"} value={form.description} onChange={set("description")}
          placeholder="Stüdyonuzu kısaca tanıtın (randevu sayfasında görünür)" />
      </div>
    </Section>
  );
}

// ─── Appointment settings ─────────────────────────────────
function AppointmentForm({ tenant }: { tenant: any }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slot_duration_minutes: tenant?.slot_duration_minutes ?? 30,
    booking_advance_days: tenant?.booking_advance_days ?? 30,
    cancellation_hours: tenant?.cancellation_hours ?? 24,
    auto_confirm: tenant?.auto_confirm ?? false,
    reminder_hours: (tenant?.reminder_hours ?? [24, 2]).join(", "),
  });

  const save = async () => {
    if (!tenant?.id) return toast.error("Stüdyo bağlı değil");
    const reminders = String(form.reminder_hours)
      .split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    setSaving(true);
    const { error } = await supabase.from("tenants").update({
      slot_duration_minutes: Number(form.slot_duration_minutes) || 30,
      booking_advance_days: Number(form.booking_advance_days) || 30,
      cancellation_hours: Number(form.cancellation_hours) || 24,
      auto_confirm: form.auto_confirm,
      reminder_hours: reminders.length ? reminders : [24, 2],
    }).eq("id", tenant.id);
    setSaving(false);
    if (error) toast.error("Kaydedilemedi", { description: error.message });
    else toast.success("Randevu ayarları güncellendi");
  };

  return (
    <Section title="Randevu Ayarları" onSave={save} saving={saving}>
      <div>
        <label className={labelCls}>Randevu slot süresi</label>
        <select className={inputCls} value={form.slot_duration_minutes}
          onChange={(e) => setForm((f) => ({ ...f, slot_duration_minutes: Number(e.target.value) }))}>
          <option value={15}>15 dakika</option>
          <option value={30}>30 dakika</option>
          <option value={45}>45 dakika</option>
          <option value={60}>60 dakika</option>
        </select>
        <p className="text-ink-subtle text-xs mt-1">Randevu takviminde gösterilecek zaman aralığı.</p>
      </div>
      <div>
        <label className={labelCls}>Önceden randevu alınabilecek gün sayısı</label>
        <input type="number" min={1} className={inputCls} value={form.booking_advance_days}
          onChange={(e) => setForm((f) => ({ ...f, booking_advance_days: e.target.value as any }))} />
        <p className="text-ink-subtle text-xs mt-1">Müşteriler en fazla kaç gün ilerisi için randevu alabilir.</p>
      </div>
      <div>
        <label className={labelCls}>İptal süresi (saat)</label>
        <input type="number" min={0} className={inputCls} value={form.cancellation_hours}
          onChange={(e) => setForm((f) => ({ ...f, cancellation_hours: e.target.value as any }))} />
        <p className="text-ink-subtle text-xs mt-1">Randevudan kaç saat öncesine kadar iptal edilebilir.</p>
      </div>
      <div>
        <label className={labelCls}>Hatırlatma saatleri</label>
        <input className={inputCls} value={form.reminder_hours}
          onChange={(e) => setForm((f) => ({ ...f, reminder_hours: e.target.value }))} placeholder="24, 2" />
        <p className="text-ink-subtle text-xs mt-1">Randevudan kaç saat önce hatırlatma gönderilsin (virgülle ayırın).</p>
      </div>
      <label className="flex items-start gap-3 p-3 rounded-xl border border-line bg-surface-soft cursor-pointer">
        <input type="checkbox" className="mt-0.5 w-4 h-4 accent-brand"
          checked={form.auto_confirm}
          onChange={(e) => setForm((f) => ({ ...f, auto_confirm: e.target.checked }))} />
        <span>
          <span className="block text-sm font-medium text-ink">Randevuları otomatik onayla</span>
          <span className="block text-ink-subtle text-xs mt-0.5">
            Kapalıyken yeni randevular "Bekliyor" durumunda gelir ve manuel onay gerektirir.
          </span>
        </span>
      </label>
    </Section>
  );
}

// ─── Subscription (read-only) ─────────────────────────────
function SubscriptionView({ subscription }: { subscription: any }) {
  const planLabels: Record<string, string> = { starter: "Başlangıç", pro: "Profesyonel", enterprise: "Kurumsal" };
  const planFeatures: Record<string, string[]> = {
    starter: ["1 stüdyo", "Online randevu sayfası", "SMS hatırlatma", "Temel raporlar"],
    pro: ["Başlangıç'taki her şey", "Sınırsız personel", "Gelişmiş analitik", "E-posta kampanyaları"],
    enterprise: ["Profesyonel'deki her şey", "Çoklu şube yönetimi", "API erişimi", "Öncelikli destek"],
  };
  const features = subscription ? (planFeatures[subscription.plan] ?? []) : [];
  const statusLabels: Record<string, string> = {
    active: "Aktif", trialing: "Deneme", past_due: "Ödeme Gecikti", canceled: "İptal Edildi", paused: "Duraklatıldı",
  };
  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700", trialing: "bg-brand/10 text-brand",
    past_due: "bg-amber-100 text-amber-700", canceled: "bg-red-100 text-red-700", paused: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="card border border-line space-y-5">
      <h2 className="font-semibold text-ink">Abonelik</h2>
      {!subscription ? (
        <p className="text-ink-subtle text-sm">Abonelik bilgisi bulunamadı.</p>
      ) : (
        <>
          <div className="flex items-center justify-between p-4 bg-brand-soft border border-brand/20 rounded-xl">
            <div>
              <p className="text-xs text-ink-subtle">Mevcut Plan</p>
              <p className="text-xl font-bold text-ink">{planLabels[subscription.plan] ?? subscription.plan}</p>
            </div>
            <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full", statusColor[subscription.status] ?? "bg-gray-100 text-gray-600")}>
              {statusLabels[subscription.status] ?? subscription.status}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {subscription.status === "trialing" && subscription.trial_ends_at && (
              <Info label="Deneme bitiş" value={formatDate(subscription.trial_ends_at)} />
            )}
            {subscription.current_period_end && (
              <Info label={subscription.status === "trialing" ? "Sonraki yenileme" : "Dönem bitiş"} value={formatDate(subscription.current_period_end)} />
            )}
          </div>
          {features.length > 0 && (
            <div className="border-t border-line pt-4">
              <p className="text-xs font-medium text-ink-subtle mb-3">Plan özellikleri</p>
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink">
                    <Check className="w-4 h-4 text-brand shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button disabled className="btn-gold opacity-50 cursor-not-allowed w-full">
            Planı Yükselt (yakında)
          </button>
        </>
      )}
    </div>
  );
}

// ─── Security ─────────────────────────────────────────────
function SecurityForm({ email }: { email?: string }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const save = async () => {
    if (!pw.current) return toast.error("Mevcut şifrenizi girin");
    if (pw.next.length < 8) return toast.error("Yeni şifre en az 8 karakter olmalı");
    if (pw.next !== pw.confirm) return toast.error("Şifreler eşleşmiyor");
    if (!email) return toast.error("Oturum bilgisi okunamadı");
    setSaving(true);
    // Supabase updateUser mevcut şifreyi doğrulamaz — önce yeniden giriş ile teyit et.
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: pw.current });
    if (reauthError) {
      setSaving(false);
      return toast.error("Mevcut şifre hatalı");
    }
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setSaving(false);
    if (error) toast.error("Şifre değiştirilemedi", { description: error.message });
    else { toast.success("Şifre güncellendi"); setPw({ current: "", next: "", confirm: "" }); }
  };

  return (
    <Section title="Güvenlik" onSave={save} saving={saving} saveLabel="Şifreyi Değiştir">
      <div>
        <label className={labelCls}>Mevcut Şifre</label>
        <input type="password" autoComplete="current-password" className={inputCls} value={pw.current}
          onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
      </div>
      <div>
        <label className={labelCls}>Yeni Şifre</label>
        <input type="password" autoComplete="new-password" className={inputCls} value={pw.next}
          onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="En az 8 karakter" />
      </div>
      <div>
        <label className={labelCls}>Yeni Şifre (Tekrar)</label>
        <input type="password" autoComplete="new-password" className={inputCls} value={pw.confirm}
          onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" />
      </div>
    </Section>
  );
}

// ─── Shared bits ──────────────────────────────────────────
function Section({ title, children, onSave, saving, saveLabel = "Kaydet" }: {
  title: string; children: React.ReactNode; onSave: () => void; saving: boolean; saveLabel?: string;
}) {
  return (
    <div className="card border border-line space-y-5">
      <h2 className="font-semibold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
      <div className="flex justify-end pt-2 border-t border-line">
        <button onClick={onSave} disabled={saving}
          className="bg-brand hover:bg-brand-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-subtle">{label}</span>
      <span className="text-ink font-medium">{value}</span>
    </div>
  );
}

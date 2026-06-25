"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Field, Input, Button, FullPageSpinner } from "@/components/ui";
import { Sparkles, Store, CalendarClock, Scissors, Plus, X, Link2, ArrowRight } from "lucide-react";

const SLOT_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];
const slotLabel = (m: number) => (m < 60 ? `${m} dk` : m % 60 === 0 ? `${m / 60} saat` : `${Math.floor(m / 60)}.5 saat`);

function slugify(raw: string): string {
  return raw
    .trim().toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const labelCls = "block text-sm font-medium text-ink-muted mb-1.5";
const selectCls = "w-full bg-surface-soft border border-line rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-all";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", studioName: "", slug: "" });
  const [originalEmail, setOriginalEmail] = useState("");
  const [settings, setSettings] = useState({
    slotDuration: 30, autoConfirm: false, cancellationHours: 24, bookingAdvanceDays: 30, reminderHours: "24, 2",
  });
  const [services, setServices] = useState<{ name: string; duration: string; price: string }[]>([]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setSetting = (k: keyof typeof settings, v: any) => setSettings((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      setToken(session.access_token);
      const { data: profile } = await supabase
        .from("profiles").select("first_name, last_name, phone, tenant_id").eq("id", session.user.id).single();
      if (profile?.tenant_id) { router.replace("/dashboard"); return; } // already has a studio
      const email = session.user.email ?? "";
      setForm((f) => ({
        ...f,
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        phone: profile?.phone ?? "",
        email,
      }));
      setOriginalEmail(email);
      setReady(true);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStudioName = (v: string) => setForm((f) => ({ ...f, studioName: v, slug: slugEdited ? f.slug : slugify(v) }));
  const onSlug = (v: string) => { setSlugEdited(true); set("slug", slugify(v)); };

  const addService = () => setServices((s) => [...s, { name: "", duration: "60", price: "" }]);
  const updateService = (i: number, k: string, v: string) => setServices((s) => s.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  const removeService = (i: number) => setServices((s) => s.filter((_, idx) => idx !== i));

  const submit = async () => {
    const slug = slugEdited ? form.slug : slugify(form.studioName);
    if (!form.firstName.trim() || !form.phone.trim() || !form.studioName.trim() || !slug) {
      toast.error("Ad, telefon ve stüdyo adı zorunlu"); return;
    }
    setSaving(true);

    // Email change goes through the auth SDK (sends a confirmation link).
    if (form.email.trim() && form.email.trim() !== originalEmail) {
      const { error } = await supabase.auth.updateUser({ email: form.email.trim() });
      if (error) toast.error("E-posta güncellenemedi", { description: error.message });
      else toast.success("Onay e-postası gönderildi", { description: "Yeni adresinizi doğrulayın." });
    }

    const reminderHours = settings.reminderHours.split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        firstName: form.firstName, lastName: form.lastName, phone: form.phone,
        studioName: form.studioName, slug,
        settings: {
          slotDuration: settings.slotDuration, autoConfirm: settings.autoConfirm,
          cancellationHours: Number(settings.cancellationHours), bookingAdvanceDays: Number(settings.bookingAdvanceDays),
          reminderHours,
        },
        services: services.filter((x) => x.name.trim()).map((x) => ({ name: x.name, duration: Number(x.duration), price: Number(x.price) })),
      }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.error(d.error ?? "Stüdyo oluşturulamadı"); return; }
    toast.success("Stüdyonuz oluşturuldu! 🎉");
    window.location.href = "/dashboard"; // full reload so UserProvider picks up the tenant
  };

  if (!ready) return <FullPageSpinner />;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-20 bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center"><Sparkles className="w-5 h-5 text-surface" /></div>
            <span className="font-bold text-sm">Stüdyonu Oluştur</span>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-ink-muted hover:text-brand transition-colors">
            Stüdyo bağlamadan devam et
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Stüdyonu birkaç dakikada kur ✨</h1>
          <p className="text-ink-subtle text-sm mt-1">Bilgilerini doldur; hizmetleri sonra Ayarlar'dan da ekleyebilirsin.</p>
        </div>

        {/* Kişisel + stüdyo */}
        <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Store className="w-4 h-4 text-brand" /> Stüdyo Bilgileri</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ad *"><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
            <Field label="Soyad"><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon *"><Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="05xx xxx xx xx" /></Field>
            <Field label="E-posta *" hint="Değiştirirsen onay maili gönderilir."><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          </div>
          <Field label="Stüdyo Adı *"><Input value={form.studioName} onChange={(e) => onStudioName(e.target.value)} placeholder="Glamour Nails" /></Field>
          <div>
            <label className={labelCls}>Randevu Linki</label>
            <Input value={form.slug} onChange={(e) => onSlug(e.target.value)} placeholder="glamour-nails" />
            <p className="text-[11px] text-ink-subtle mt-1 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> /book/{form.slug || "studyo"} — addan otomatik, Ayarlar'dan değiştirilebilir
            </p>
          </div>
        </section>

        {/* Randevu ayarları */}
        <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><CalendarClock className="w-4 h-4 text-brand" /> Randevu Ayarları</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Slot süresi</label>
              <select className={selectCls} value={settings.slotDuration} onChange={(e) => setSetting("slotDuration", Number(e.target.value))}>
                {SLOT_OPTIONS.map((m) => <option key={m} value={m}>{slotLabel(m)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>İptal süresi (saat)</label>
              <Input type="number" min={0} value={settings.cancellationHours} onChange={(e) => setSetting("cancellationHours", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>İleri rezervasyon (gün)</label>
              <Input type="number" min={1} value={settings.bookingAdvanceDays} onChange={(e) => setSetting("bookingAdvanceDays", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hatırlatma (saat, virgüllü)</label>
              <Input value={settings.reminderHours} onChange={(e) => setSetting("reminderHours", e.target.value)} placeholder="24, 2" />
            </div>
          </div>
          <label className="flex items-center justify-between gap-3 bg-surface-soft border border-line rounded-xl px-3 py-2.5 cursor-pointer">
            <span className="text-sm text-ink">Randevuları otomatik onayla</span>
            <input type="checkbox" checked={settings.autoConfirm} onChange={(e) => setSetting("autoConfirm", e.target.checked)} className="accent-[rgb(var(--ns-brand))] w-4 h-4" />
          </label>
        </section>

        {/* Hizmetler (opsiyonel) */}
        <section className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><Scissors className="w-4 h-4 text-brand" /> Hizmetler <span className="text-ink-subtle text-xs font-normal">(opsiyonel)</span></h2>
            <button onClick={addService} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"><Plus className="w-4 h-4" /> Ekle</button>
          </div>
          {services.length === 0 ? (
            <p className="text-ink-subtle text-sm">Şimdilik atlayabilirsin — sonra Ayarlar &gt; Hizmetler'den eklersin.</p>
          ) : (
            <div className="space-y-2">
              {services.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={s.name} onChange={(e) => updateService(i, "name", e.target.value)} placeholder="Hizmet adı" className="flex-1" />
                  <Input type="number" value={s.duration} onChange={(e) => updateService(i, "duration", e.target.value)} placeholder="dk" className="w-20" />
                  <Input type="number" value={s.price} onChange={(e) => updateService(i, "price", e.target.value)} placeholder="₺" className="w-24" />
                  <button onClick={() => removeService(i)} className="text-ink-subtle hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1 text-center border border-line text-ink-muted hover:border-brand font-medium py-3 rounded-xl transition-all bg-surface">
            Şimdilik atla
          </Link>
          <Button onClick={submit} loading={saving} className="flex-1 py-3">
            Stüdyomu Oluştur <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

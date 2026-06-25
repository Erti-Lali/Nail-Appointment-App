"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@nailstudio/shared";
import { toast } from "sonner";
import {
  Loader2, Building2, Users, CalendarDays, TrendingUp,
  LogOut, Shield, ExternalLink, ArrowLeft, Plus, KeyRound, X, Check, Copy,
  Settings, Link2,
} from "lucide-react";

const SLOT_DURATIONS = [15, 30, 45, 60];

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function bookingUrl(slug: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/book/${slug}`;
}

const PLAN_LABELS: Record<string, string> = {
  baslangic: "Başlangıç", profesyonel: "Profesyonel", isletme: "İşletme",
};
const ROLE_LABELS: Record<string, string> = {
  super_admin: "Süper Admin", tenant_admin: "Stüdyo Admini", staff: "Personel", customer: "Müşteri",
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [data, setData] = useState<any>(null);
  const [token, setToken] = useState("");
  const [meId, setMeId] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editTenant, setEditTenant] = useState<any>(null);
  const [createdLink, setCreatedLink] = useState<{ name: string; slug: string } | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);

  const fetchData = async (tk: string) => {
    const res = await fetch("/api/admin/data", { headers: { Authorization: `Bearer ${tk}` } });
    if (res.status === 403) { setDenied(true); return; }
    if (!res.ok) { toast.error("Veri alınamadı"); return; }
    setData(await res.json());
  };

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      setToken(session.access_token);
      setMeId(session.user.id);
      await fetchData(session.access_token);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTenant = async (tenantId: string, patch: Record<string, unknown>) => {
    const prev = data;
    setData((d: any) => ({ ...d, tenants: d.tenants.map((t: any) => (t.id === tenantId ? { ...t, ...patch } : t)) }));
    const res = await fetch("/api/admin/tenant", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tenantId, ...patch }),
    });
    if (!res.ok) { setData(prev); toast.error("Güncellenemedi"); } else toast.success("Güncellendi");
  };

  const mergeTenant = (updated: any) => {
    setData((d: any) => ({ ...d, tenants: d.tenants.map((t: any) => (t.id === updated.id ? { ...t, ...updated } : t)) }));
  };

  const changeRole = async (userId: string, role: string) => {
    const prev = data;
    setData((d: any) => ({ ...d, users: d.users.map((u: any) => (u.id === userId ? { ...u, role } : u)) }));
    const res = await fetch("/api/admin/user", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, action: "role", role }),
    });
    if (!res.ok) {
      setData(prev);
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "Rol değiştirilemedi");
    } else toast.success("Rol güncellendi");
  };

  const resetPassword = async (userId: string, email: string) => {
    const res = await fetch("/api/admin/user", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, action: "reset_password" }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(j.error ?? "Sıfırlanamadı"); return; }
    setResetResult({ email, password: j.tempPassword });
  };

  const signOut = async () => { await supabase.auth.signOut(); router.push("/auth/login"); };

  if (loading) {
    return <div className="min-h-screen bg-canvas flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand animate-spin" /></div>;
  }
  if (denied) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="bg-surface border border-line rounded-2xl p-8 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4"><Shield className="w-7 h-7 text-brand" /></div>
          <h1 className="text-xl font-bold text-ink">Erişim yetkiniz yok</h1>
          <p className="text-ink-muted text-sm mt-2">Bu panel yalnızca platform yöneticilerine açıktır.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 mt-6 bg-brand hover:bg-brand-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"><ArrowLeft className="w-4 h-4" /> Panele Dön</Link>
        </div>
      </div>
    );
  }

  const { stats, tenants, users } = data;
  const KPIS = [
    { icon: Building2, label: "Stüdyo", value: `${stats.activeTenants}/${stats.tenants}`, sub: "aktif / toplam" },
    { icon: Users, label: "Kullanıcı", value: stats.users, sub: "toplam hesap" },
    { icon: CalendarDays, label: "Randevu", value: stats.appointments, sub: "tüm zamanlar" },
    { icon: TrendingUp, label: "Ciro", value: formatPrice(stats.revenue, "TRY"), sub: "tamamlanan" },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-20 bg-surface border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0"><Shield className="w-5 h-5 text-white" /></div>
            <div className="leading-tight min-w-0">
              <p className="font-bold text-sm truncate">Platform Yönetimi</p>
              <p className="text-ink-subtle text-xs">NailStudio 101 · Süper Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand px-3 py-2 transition-colors"><ArrowLeft className="w-4 h-4" /> Stüdyo Paneli</Link>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-red-500 px-3 py-2 transition-colors"><LogOut className="w-4 h-4" /> Çıkış</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {KPIS.map((k) => (
            <div key={k.label} className="bg-surface border border-line rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-ink-subtle text-xs">{k.label}</p>
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><k.icon className="w-4 h-4 text-brand" /></div>
              </div>
              <p className="text-2xl font-bold mt-2 leading-tight">{k.value}</p>
              <p className="text-ink-subtle text-[11px] mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Studios / subscriptions */}
        <section className="bg-surface border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Stüdyolar & Abonelikler</h2>
              <p className="text-ink-subtle text-xs mt-0.5">{tenants.length} stüdyo</p>
            </div>
            <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors shrink-0">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Yeni Stüdyo</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-subtle border-b border-line">
                  <th className="px-5 py-3 font-medium">Stüdyo</th>
                  <th className="px-3 py-3 font-medium">Plan</th>
                  <th className="px-3 py-3 font-medium text-center">Müşteri</th>
                  <th className="px-3 py-3 font-medium text-center">Randevu</th>
                  <th className="px-3 py-3 font-medium text-right">Ciro</th>
                  <th className="px-3 py-3 font-medium text-center">Durum</th>
                  <th className="px-3 py-3 font-medium text-right">Sayfa</th>
                  <th className="px-5 py-3 font-medium text-right">Ayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tenants.map((t: any) => (
                  <tr key={t.id} className="hover:bg-canvas transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/studio/${t.id}`} className="font-medium hover:text-brand transition-colors">{t.name}</Link>
                      <p className="text-ink-subtle text-xs">/{t.slug}</p>
                    </td>
                    <td className="px-3 py-3">
                      <select value={t.subscription_plan} onChange={(e) => updateTenant(t.id, { subscription_plan: e.target.value })}
                        className="bg-surface-soft border border-line rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand cursor-pointer">
                        {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-center">{t.customers}</td>
                    <td className="px-3 py-3 text-center">{t.appointments}</td>
                    <td className="px-3 py-3 text-right text-brand font-semibold whitespace-nowrap">{formatPrice(t.revenue, "TRY")}</td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => updateTenant(t.id, { is_active: !t.is_active })}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${t.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                        {t.is_active ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <a href={`/book/${t.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-muted hover:text-brand text-xs">Aç <ExternalLink className="w-3 h-3" /></a>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setEditTenant(t)} title="Detaylı ayarlar"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-muted hover:text-brand hover:bg-brand/10 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Users */}
        <section className="bg-surface border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="font-semibold">Kullanıcılar</h2>
            <p className="text-ink-subtle text-xs mt-0.5">{users.length} hesap</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-subtle border-b border-line">
                  <th className="px-5 py-3 font-medium">Ad</th>
                  <th className="px-3 py-3 font-medium">E-posta</th>
                  <th className="px-3 py-3 font-medium">Rol</th>
                  <th className="px-3 py-3 font-medium">Stüdyo</th>
                  <th className="px-5 py-3 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-canvas transition-colors">
                    <td className="px-5 py-3 font-medium whitespace-nowrap">{u.name}{u.id === meId && <span className="text-ink-subtle font-normal"> (siz)</span>}</td>
                    <td className="px-3 py-3 text-ink-muted">{u.email}</td>
                    <td className="px-3 py-3">
                      <select value={u.role} disabled={u.id === meId} onChange={(e) => changeRole(u.id, e.target.value)}
                        className="bg-surface-soft border border-line rounded-lg px-2 py-1.5 text-xs outline-none focus:border-brand cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{u.tenant_name}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => resetPassword(u.id, u.email)} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-brand border border-line hover:border-brand rounded-lg px-2.5 py-1.5 transition-colors">
                        <KeyRound className="w-3.5 h-3.5" /> Şifre Sıfırla
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showNew && (
        <NewStudioModal
          token={token}
          onClose={() => setShowNew(false)}
          onCreated={(tenant) => { setShowNew(false); fetchData(token); if (tenant) setCreatedLink(tenant); }}
        />
      )}
      {editTenant && (
        <EditStudioModal
          token={token}
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
          onSaved={(updated) => { mergeTenant(updated); setEditTenant(null); }}
        />
      )}
      {createdLink && <StudioLinkModal tenant={createdLink} onClose={() => setCreatedLink(null)} />}
      {resetResult && <ResetResultModal data={resetResult} onClose={() => setResetResult(null)} />}
    </div>
  );
}

function NewStudioModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (tenant?: { name: string; slug: string }) => void }) {
  const [form, setForm] = useState({ name: "", slug: "", plan: "baslangic", ownerEmail: "", ownerPassword: "", ownerFirstName: "", ownerLastName: "" });
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const inp = "w-full bg-surface-soft border border-line rounded-xl px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-brand transition-all";
  const lbl = "block text-xs font-medium text-ink-muted mb-1";

  // İsim yazıldıkça slug'ı (randevu linkini) otomatik üret — kullanıcı elle değiştirmediyse.
  const onNameChange = (v: string) => {
    setForm((f) => ({ ...f, name: v, slug: slugEdited ? f.slug : slugify(v) }));
  };
  const onSlugChange = (v: string) => { setSlugEdited(true); set("slug", slugify(v)); };

  const submit = async () => {
    const slug = slugEdited ? form.slug : slugify(form.name);
    if (!form.name.trim() || !slug) { toast.error("İsim zorunlu"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/studio", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, slug }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.error(j.error ?? "Oluşturulamadı"); return; }
    toast.success(j.ownerWarning ? "Stüdyo oluştu (sahip hesabı hariç)" : "Stüdyo oluşturuldu");
    if (j.ownerWarning) toast.error(j.ownerWarning);
    onCreated(j.tenant ? { name: j.tenant.name, slug: j.tenant.slug } : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl shadow-xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-surface">
          <h2 className="font-semibold">Yeni Stüdyo</h2>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className={lbl}>Stüdyo Adı *</label><input className={inp} value={form.name} onChange={(e) => onNameChange(e.target.value)} placeholder="Glamour Nails" /></div>
          <div>
            <label className={lbl}>Randevu Linki (otomatik)</label>
            <input className={inp} value={form.slug} onChange={(e) => onSlugChange(e.target.value)} placeholder="glamour-nails" />
            <p className="text-[10px] text-ink-subtle mt-1 flex items-center gap-1"><Link2 className="w-3 h-3" /> /book/{form.slug || "slug"} — isimden otomatik üretilir, gerekirse düzenleyin</p>
          </div>
          <div>
            <label className={lbl}>Plan</label>
            <select className={inp + " cursor-pointer"} value={form.plan} onChange={(e) => set("plan", e.target.value)}>
              {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="pt-2 border-t border-line">
            <p className="text-xs font-semibold text-ink-muted mb-2">Sahip Hesabı (opsiyonel)</p>
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} value={form.ownerFirstName} onChange={(e) => set("ownerFirstName", e.target.value)} placeholder="Ad" />
              <input className={inp} value={form.ownerLastName} onChange={(e) => set("ownerLastName", e.target.value)} placeholder="Soyad" />
            </div>
            <input className={inp + " mt-2"} type="email" value={form.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} placeholder="E-posta" />
            <input className={inp + " mt-2"} type="text" value={form.ownerPassword} onChange={(e) => set("ownerPassword", e.target.value)} placeholder="Şifre (boşsa rastgele)" />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 border border-line text-ink-muted hover:border-brand font-medium py-2.5 rounded-xl transition-all">İptal</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditStudioModal({ token, tenant, onClose, onSaved }: {
  token: string;
  tenant: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const [form, setForm] = useState({
    name: tenant.name ?? "",
    slug: tenant.slug ?? "",
    description: tenant.description ?? "",
    subscription_plan: tenant.subscription_plan ?? "baslangic",
    is_active: tenant.is_active ?? true,
    slot_duration_minutes: tenant.slot_duration_minutes ?? 30,
    auto_confirm: tenant.auto_confirm ?? false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const inp = "w-full bg-surface-soft border border-line rounded-xl px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-brand transition-all";
  const lbl = "block text-xs font-medium text-ink-muted mb-1";

  const copyLink = () => { navigator.clipboard?.writeText(bookingUrl(form.slug)); toast.success("Link kopyalandı"); };

  const submit = async () => {
    if (!form.name.trim() || !slugify(form.slug)) { toast.error("İsim ve link zorunlu"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/tenant", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tenantId: tenant.id,
        name: form.name.trim(),
        slug: slugify(form.slug),
        description: form.description,
        subscription_plan: form.subscription_plan,
        is_active: form.is_active,
        slot_duration_minutes: form.slot_duration_minutes,
        auto_confirm: form.auto_confirm,
      }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.error(j.error ?? "Kaydedilemedi"); return; }
    toast.success("Ayarlar kaydedildi");
    onSaved(j.tenant ?? { id: tenant.id, ...form, slug: slugify(form.slug) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-2xl shadow-xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-4 h-4 text-brand shrink-0" />
            <h2 className="font-semibold truncate">Stüdyo Ayarları</h2>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className={lbl}>Stüdyo Adı *</label><input className={inp} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>

          <div>
            <label className={lbl}>Randevu Linki *</label>
            <input className={inp} value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
            <div className="flex items-center gap-2 mt-1.5">
              <code className="flex-1 text-[11px] text-ink-muted bg-surface-soft border border-line rounded-lg px-2 py-1.5 truncate">{bookingUrl(slugify(form.slug) || "slug")}</code>
              <button onClick={copyLink} className="text-ink-subtle hover:text-brand shrink-0" title="Linki kopyala"><Copy className="w-4 h-4" /></button>
              <a href={`/book/${slugify(form.slug)}`} target="_blank" rel="noreferrer" className="text-ink-subtle hover:text-brand shrink-0" title="Linki aç"><ExternalLink className="w-4 h-4" /></a>
            </div>
          </div>

          <div>
            <label className={lbl}>Açıklama</label>
            <textarea className={inp + " resize-none"} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Stüdyo hakkında kısa açıklama" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Plan</label>
              <select className={inp + " cursor-pointer"} value={form.subscription_plan} onChange={(e) => set("subscription_plan", e.target.value)}>
                {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Randevu Slot Süresi</label>
              <select className={inp + " cursor-pointer"} value={form.slot_duration_minutes} onChange={(e) => set("slot_duration_minutes", Number(e.target.value))}>
                {SLOT_DURATIONS.map((m) => <option key={m} value={m}>{m} dk</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 bg-surface-soft border border-line rounded-xl px-3 py-2.5 cursor-pointer">
            <span className="text-sm text-ink">Stüdyo aktif</span>
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="accent-[rgb(var(--ns-brand))] w-4 h-4" />
          </label>

          <label className="flex items-center justify-between gap-3 bg-surface-soft border border-line rounded-xl px-3 py-2.5 cursor-pointer">
            <span className="text-sm text-ink">Randevuları otomatik onayla</span>
            <input type="checkbox" checked={form.auto_confirm} onChange={(e) => set("auto_confirm", e.target.checked)} className="accent-[rgb(var(--ns-brand))] w-4 h-4" />
          </label>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 border border-line text-ink-muted hover:border-brand font-medium py-2.5 rounded-xl transition-all">İptal</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudioLinkModal({ tenant, onClose }: { tenant: { name: string; slug: string }; onClose: () => void }) {
  const url = bookingUrl(tenant.slug);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-line rounded-2xl shadow-xl p-6 animate-slide-up text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3"><Link2 className="w-6 h-6 text-brand" /></div>
        <h2 className="font-bold text-ink">{tenant.name} hazır</h2>
        <p className="text-ink-muted text-sm mt-1">Randevu linki otomatik oluşturuldu.</p>
        <div className="mt-4 flex items-center gap-2 bg-surface-soft border border-line rounded-xl px-3 py-2.5">
          <code className="flex-1 text-ink font-mono text-xs break-all text-left">{url}</code>
          <button onClick={() => { navigator.clipboard?.writeText(url); toast.success("Kopyalandı"); }} className="text-ink-subtle hover:text-brand shrink-0"><Copy className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2 mt-5">
          <a href={`/book/${tenant.slug}`} target="_blank" rel="noreferrer" className="flex-1 border border-line text-ink-muted hover:border-brand font-medium py-2.5 rounded-xl transition-all inline-flex items-center justify-center gap-1.5">Linki Aç <ExternalLink className="w-4 h-4" /></a>
          <button onClick={onClose} className="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl transition-colors">Tamam</button>
        </div>
      </div>
    </div>
  );
}

function ResetResultModal({ data, onClose }: { data: { email: string; password: string }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-line rounded-2xl shadow-xl p-6 animate-slide-up text-center">
        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3"><Check className="w-6 h-6 text-green-600" /></div>
        <h2 className="font-bold text-ink">Geçici şifre oluşturuldu</h2>
        <p className="text-ink-muted text-sm mt-1">{data.email}</p>
        <div className="mt-4 flex items-center gap-2 bg-surface-soft border border-line rounded-xl px-3 py-2.5">
          <code className="flex-1 text-ink font-mono text-sm break-all text-left">{data.password}</code>
          <button onClick={() => { navigator.clipboard?.writeText(data.password); toast.success("Kopyalandı"); }} className="text-ink-subtle hover:text-brand shrink-0"><Copy className="w-4 h-4" /></button>
        </div>
        <p className="text-[11px] text-ink-subtle mt-3">Bu şifreyi kullanıcıyla paylaşın; ilk girişte değiştirmesini önerin.</p>
        <button onClick={onClose} className="w-full mt-5 bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 rounded-xl transition-colors">Tamam</button>
      </div>
    </div>
  );
}

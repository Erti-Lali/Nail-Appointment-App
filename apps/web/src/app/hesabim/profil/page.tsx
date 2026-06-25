"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Field, Input, Button, Spinner } from "@/components/ui";
import { User, Lock } from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", birthDate: "" });
  const [originalEmail, setOriginalEmail] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setToken(session.access_token);
      const res = await fetch("/api/customer/profile", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const d = await res.json();
        setForm({ firstName: d.firstName, lastName: d.lastName, phone: d.phone, email: d.email, birthDate: d.birthDate || "" });
        setOriginalEmail(d.email ?? "");
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase() || "?";

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) { toast.error("Ad zorunlu"); return; }
    if (!form.phone.trim()) { toast.error("Telefon zorunlu"); return; }
    setSavingProfile(true);
    const res = await fetch("/api/customer/profile", {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, phone: form.phone, birthDate: form.birthDate }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(d.error ?? "Kaydedilemedi"); setSavingProfile(false); return; }

    // Email change goes through the auth SDK (sends a confirmation link).
    if (form.email.trim() && form.email.trim() !== originalEmail) {
      const { error } = await supabase.auth.updateUser({ email: form.email.trim() });
      if (error) toast.error("E-posta güncellenemedi", { description: error.message });
      else { toast.success("Onay e-postası gönderildi", { description: "Yeni adresinizi doğrulayın." }); setOriginalEmail(form.email.trim()); }
    }

    if (d.phoneSync === "partial") toast.warning("Profil kaydedildi", { description: "Bazı randevu kayıtlarında telefon güncellenemedi." });
    else toast.success("Profiliniz güncellendi");
    setSavingProfile(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 6) { toast.error("Yeni şifre en az 6 karakter olmalı"); return; }
    if (pw.next !== pw.confirm) { toast.error("Şifreler eşleşmiyor"); return; }
    setSavingPw(true);
    // Verify current password by re-authenticating.
    const { error: reauthErr } = await supabase.auth.signInWithPassword({ email: originalEmail, password: pw.current });
    if (reauthErr) { toast.error("Mevcut şifreniz hatalı"); setSavingPw(false); return; }
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) { toast.error("Şifre güncellenemedi", { description: error.message }); setSavingPw(false); return; }
    toast.success("Şifreniz güncellendi");
    setPw({ current: "", next: "", confirm: "" });
    setSavingPw(false);
  };

  return (
    <CustomerShell active="profile">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink">Profilim</h1>
        <p className="text-ink-subtle text-sm mt-1">Kişisel bilgilerinizi ve şifrenizi güncelleyin.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-6 max-w-xl">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-ink">{form.firstName} {form.lastName}</p>
              <p className="text-ink-subtle text-sm">{form.email || form.phone}</p>
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={saveProfile} className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-ink flex items-center gap-2"><User className="w-4 h-4 text-brand" /> Kişisel Bilgiler</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad *"><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></Field>
              <Field label="Soyad"><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
            </div>
            <Field label="Telefon *" hint="Randevularınız bu numarayla eşleştirilir."><Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></Field>
            <Field label="E-posta"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Doğum Tarihi"><Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} /></Field>
            <Button type="submit" loading={savingProfile}>Değişiklikleri Kaydet</Button>
          </form>

          {/* Password form */}
          <form onSubmit={changePassword} className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-ink flex items-center gap-2"><Lock className="w-4 h-4 text-brand" /> Şifre Değiştir</h2>
            <Field label="Mevcut Şifre"><Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} autoComplete="current-password" required /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Yeni Şifre"><Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} autoComplete="new-password" minLength={6} required /></Field>
              <Field label="Yeni Şifre (Tekrar)"><Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" minLength={6} required /></Field>
            </div>
            <Button type="submit" variant="ghost" loading={savingPw}>Şifreyi Güncelle</Button>
          </form>
        </div>
      )}
    </CustomerShell>
  );
}

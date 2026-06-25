"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Field, Input, Button } from "@/components/ui";

export default function CustomerRegisterPage() {
  const supabase = createClient();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim()) { toast.error("Telefon zorunlu", { description: "Randevularınızı eşleştirmek için gereklidir." }); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone.replace(/\s+/g, ""),
          role: "customer",
        },
      },
    });
    if (error) { toast.error("Kayıt başarısız", { description: error.message }); setLoading(false); return; }
    toast.success("Hesap oluşturuldu!");
    window.location.href = "/hesabim";
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand transition-colors">
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-gold mb-4"><Sparkles className="w-7 h-7 text-surface" /></div>
          <h1 className="font-display text-2xl font-bold text-ink">Hesap Oluştur</h1>
          <p className="text-ink-subtle text-sm mt-1">Randevularınızı tek yerden takip edin</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-card">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad"><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Ayşe" required /></Field>
              <Field label="Soyad"><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Yılmaz" /></Field>
            </div>
            <Field label="Telefon *" hint="Randevularınız bu numarayla eşleştirilir."><Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="05xx xxx xx xx" required /></Field>
            <Field label="E-posta"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ornek@mail.com" required /></Field>
            <Field label="Şifre"><Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="En az 6 karakter" required minLength={6} /></Field>
            <Button type="submit" className="w-full" loading={loading}>Kayıt Ol</Button>
          </form>
          <p className="text-center text-sm text-ink-muted mt-5">
            Zaten hesabınız var mı? <Link href="/hesabim/giris" className="text-brand font-semibold hover:text-brand-dark">Giriş yapın</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

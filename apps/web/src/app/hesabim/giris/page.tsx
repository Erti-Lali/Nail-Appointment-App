"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Field, Input, Button } from "@/components/ui";

export default function CustomerLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { toast.error("Giriş başarısız", { description: error.message }); setLoading(false); return; }
    toast.success("Hoş geldiniz!");
    window.location.href = "/hesabim";
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand transition-colors">
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-gold mb-4"><Sparkles className="w-7 h-7 text-[#FFFFFF]" /></div>
          <h1 className="font-display text-2xl font-bold text-ink">Randevularım</h1>
          <p className="text-ink-subtle text-sm mt-1">Hesabınıza giriş yapın</p>
        </div>
        <div className="bg-[#FFFFFF] border border-line rounded-2xl p-6 shadow-card">
          <form onSubmit={submit} className="space-y-4">
            <Field label="E-posta"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="ornek@mail.com" required /></Field>
            <Field label="Şifre"><Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" required /></Field>
            <Button type="submit" className="w-full" loading={loading}>Giriş Yap</Button>
          </form>
          <p className="text-center text-sm text-ink-muted mt-5">
            Hesabınız yok mu? <Link href="/hesabim/kayit" className="text-brand font-semibold hover:text-brand-dark">Kayıt olun</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

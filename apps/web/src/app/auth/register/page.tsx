"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          role: "tenant_admin",
        },
      },
    });

    if (error) {
      toast.error("Kayıt başarısız", { description: error.message });
      setLoading(false);
      return;
    }

    toast.success("Hesap oluşturuldu! Yönlendiriliyorsunuz...");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <Link
        href="/"
        className="absolute top-5 left-5 z-10 inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold mb-4">
            <Sparkles className="w-7 h-7 text-black" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">NailStudio 101</h1>
          <p className="text-white/40 text-sm mt-1">14 gün ücretsiz deneyin</p>
        </div>

        <div className="card border border-black-border">
          <h2 className="text-lg font-semibold text-white mb-6">Hesap Oluştur</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Ad</label>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="input"
                  placeholder="Ayşe"
                  required
                />
              </div>
              <div>
                <label className="label">Soyad</label>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="input"
                  placeholder="Yıldız"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">E-posta</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="studio@example.com"
                required
              />
            </div>

            <div>
              <label className="label">Şifre</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input"
                placeholder="En az 6 karakter"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ücretsiz Başla"}
            </button>
          </form>

          <p className="text-center text-white/30 text-sm mt-6">
            Zaten hesabınız var mı?{" "}
            <Link href="/auth/login" className="text-gold-500 hover:text-gold-400">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

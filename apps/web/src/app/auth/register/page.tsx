"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AuthBrandPanel, NailDropMark } from "@/components/auth/auth-brand-panel";

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
    <div className="min-h-screen flex bg-[#FAF3F0]">
      <AuthBrandPanel
        heading="Güzelliği büyütmeye bugün başlayın."
        subtext="14 gün ücretsiz deneyin — randevudan ödemeye, her şey tek yerde."
      />

      {/* Form paneli */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <Link
          href="/"
          className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#9B6E7A] hover:text-[#2D0A1A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </Link>

        <div className="w-full max-w-sm">
          {/* Mobil logo (sol panel gizliyken) */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <NailDropMark />
            <span className="font-display text-lg font-bold tracking-[0.12em] text-[#2D0A1A]">
              NAILSTUDIO 101
            </span>
          </div>

          <div className="card">
            <h1 className="font-display text-2xl font-bold text-[#2D0A1A]">Hesap oluşturun</h1>
            <p className="text-[#9B6E7A] text-sm mt-1 mb-6">14 gün ücretsiz deneyin</p>

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

            <p className="text-center text-[#9B6E7A] text-sm mt-6">
              Zaten hesabınız var mı?{" "}
              <Link href="/auth/login" className="font-medium text-[#C4356A] hover:text-[#9B2550] transition-colors">
                Giriş Yap
              </Link>
            </p>
          </div>

          <p className="text-center text-[#9B6E7A] text-xs mt-6" style={{ opacity: 0.7 }}>
            Kredi kartı gerekmez · İstediğiniz zaman iptal edin
          </p>
        </div>
      </div>
    </div>
  );
}

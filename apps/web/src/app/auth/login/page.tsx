"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AuthBrandPanel, NailDropMark } from "@/components/auth/auth-brand-panel";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error("Giriş başarısız", { description: error.message });
      setLoading(false);
      return;
    }

    toast.success("Hoş geldiniz!");
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex bg-[#FAF3F0]">
      <AuthBrandPanel
        heading="Stüdyonuzu zarafetle yönetin."
        subtext="Randevularınızı, müşterilerinizi ve gelirinizi tek panelden takip edin."
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
            <h1 className="font-display text-2xl font-bold text-[#2D0A1A]">Tekrar hoş geldiniz</h1>
            <p className="text-[#9B6E7A] text-sm mt-1 mb-6">Hesabınıza giriş yapın</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="studio@example.com"
                  className="input"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B6E7A] hover:text-[#2D0A1A] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-xs font-medium text-[#C4356A] hover:text-[#9B2550] transition-colors">
                  Şifremi Unuttum
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Giriş Yap"}
              </button>
            </form>

            <p className="text-center text-[#9B6E7A] text-sm mt-6">
              Hesabınız yok mu?{" "}
              <Link href="/auth/register" className="font-medium text-[#C4356A] hover:text-[#9B2550] transition-colors">
                Ücretsiz Deneyin
              </Link>
            </p>
          </div>

          <p className="text-center text-[#9B6E7A] text-xs mt-6" style={{ opacity: 0.7 }}>
            14 gün ücretsiz · Kredi kartı gerekmez
          </p>
        </div>
      </div>
    </div>
  );
}

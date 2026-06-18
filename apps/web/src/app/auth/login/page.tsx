"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <Link
        href="/"
        className="absolute top-5 left-5 z-10 inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Geri
      </Link>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-500/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold mb-4">
            <Sparkles className="w-7 h-7 text-black" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">NailStudio 101</h1>
          <p className="text-white/40 text-sm mt-1">Yönetim Paneli</p>
        </div>

        <div className="card border border-black-border">
          <h2 className="text-lg font-semibold text-white mb-6">Giriş Yap</h2>

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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-gold-500 hover:text-gold-400">
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

          <p className="text-center text-white/30 text-sm mt-6">
            Hesabınız yok mu?{" "}
            <Link href="/auth/register" className="text-gold-500 hover:text-gold-400">
              Ücretsiz Deneyin
            </Link>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          14 gün ücretsiz · Kredi kartı gerekmez
        </p>
      </div>
    </div>
  );
}

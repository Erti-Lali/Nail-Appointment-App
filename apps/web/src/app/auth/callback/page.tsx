"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FullPageSpinner } from "@/components/ui";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

// E-posta onayı / şifre sıfırlama linklerinin döndüğü sayfa.
// supabase-js implicit akışta token'ları URL hash'inden otomatik alır
// (detectSessionInUrl). PKCE akışında ?code gelir → exchangeCodeForSession.
// Oturum kurulunca "doğrulandı" ekranı gösterilir; kullanıcı devam butonuyla
// yerine gider: customer → /hesabim, stüdyosu olan → /dashboard, stüdyosu
// olmayan yeni yönetici → /studyo-olustur (stüdyo bağlamak zorunlu).
function CallbackInner() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [dest, setDest] = useState<{ href: string; label: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function run() {
      const url = new URL(window.location.href);
      const errDesc =
        url.searchParams.get("error_description") ||
        new URLSearchParams(url.hash.replace(/^#/, "")).get("error_description");
      if (errDesc) { setError(decodeURIComponent(errDesc)); return; }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { setError(error.message); return; }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("role, tenant_id").eq("id", session.user.id).single();
      if (profile?.role === "customer") setDest({ href: "/hesabim", label: "Hesabıma git" });
      else if (profile?.tenant_id) setDest({ href: "/dashboard", label: "Panele git" });
      else setDest({ href: "/studyo-olustur", label: "Stüdyonu oluştur" });
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="bg-surface border border-line rounded-2xl p-8 text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="font-bold text-ink">Bağlantı doğrulanamadı</h1>
          <p className="text-ink-muted text-sm mt-2">{error}</p>
          <Link href="/auth/login" className="inline-block mt-5 bg-brand hover:bg-brand-dark text-surface font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  if (!dest) return <FullPageSpinner />;

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="bg-surface border border-line rounded-2xl p-8 text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <h1 className="font-bold text-xl text-ink">E-postan doğrulandı ✓</h1>
        <p className="text-ink-muted text-sm mt-2">
          Hesabın hazır — devam ederek kuruluma geçebilirsin.
        </p>
        <Link
          href={dest.href}
          className="inline-flex items-center gap-2 mt-6 bg-brand hover:bg-brand-dark text-surface font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {dest.label} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <CallbackInner />
    </Suspense>
  );
}

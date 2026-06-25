"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="bg-surface border border-line rounded-2xl p-8 text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-xl font-display font-bold text-ink">Bir şeyler ters gitti</h1>
        <p className="text-ink-muted text-sm mt-2">
          Beklenmeyen bir hata oluştu. Tekrar deneyebilir ya da ana sayfaya dönebilirsiniz.
        </p>
        {error?.digest && <p className="text-ink-subtle text-[11px] mt-3 font-mono">Hata kodu: {error.digest}</p>}
        <div className="flex gap-2 mt-6">
          <button
            onClick={reset}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark text-surface font-semibold py-2.5 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Tekrar dene
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-1.5 border border-line text-ink-muted hover:border-brand font-medium py-2.5 rounded-xl transition-all"
          >
            <Home className="w-4 h-4" /> Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="bg-surface border border-line rounded-2xl p-8 text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-brand" />
        </div>
        <p className="text-4xl font-display font-bold text-brand">404</p>
        <h1 className="text-xl font-display font-bold text-ink mt-1">Sayfa bulunamadı</h1>
        <p className="text-ink-muted text-sm mt-2">
          Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 mt-6 bg-brand hover:bg-brand-dark text-surface font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" /> Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}

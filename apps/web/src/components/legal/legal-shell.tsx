import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

// Shared chrome for legal pages (/gizlilik, /kvkk).
export function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-20 bg-canvas/80 backdrop-blur-md border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center"><Sparkles className="w-5 h-5 text-surface" /></div>
            <span className="font-bold text-sm">NailStudio 101</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand transition-colors">
            <ArrowLeft className="w-4 h-4" /> Ana sayfa
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-display font-bold text-ink">{title}</h1>
        <p className="text-ink-subtle text-sm mt-2">Son güncelleme: {updated}</p>

        <div className="mt-6 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-ink-muted">
          ⚠️ Bu metin bir <strong>taslaktır</strong>. Yürürlüğe almadan önce bir hukuk danışmanına
          inceletip [köşeli parantez] içindeki alanları kendi bilgilerinizle doldurun.
        </div>

        <div className="legal-prose mt-8 space-y-5 text-ink-muted text-[15px] leading-relaxed">
          {children}
        </div>
      </main>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink mb-2">{heading}</h2>
      {children}
    </section>
  );
}

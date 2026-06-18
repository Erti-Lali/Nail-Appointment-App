import Link from "next/link";
import {
  Sparkles, CalendarDays, Globe, Users, BarChart3, Bell,
  ArrowRight, Check, CalendarClock,
} from "lucide-react";

const FEATURES = [
  { icon: CalendarDays, title: "Randevu Yönetimi", desc: "Personel bazlı takvim, çoklu hizmet seçimi ve otomatik çift-rezervasyon koruması." },
  { icon: Globe, title: "Online Randevu", desc: "Müşterileriniz size özel linkten 7/24, kayıt olmadan randevu alsın." },
  { icon: Users, title: "Müşteri Yönetimi", desc: "Ziyaret geçmişi, sadakat puanı, notlar ve etiketlerle müşterilerinizi tanıyın." },
  { icon: CalendarClock, title: "Personel & Vardiya", desc: "Çalışma saatleri, hizmet atama ve haftalık vardiya çizelgesi tek ekranda." },
  { icon: BarChart3, title: "Analitik", desc: "Ciro trendi, en çok tercih edilen hizmetler ve personel performansı." },
  { icon: Bell, title: "Hatırlatmalar", desc: "SMS ve e-posta ile otomatik randevu bildirimleri (yakında)." },
];

const STEPS = [
  { n: "1", title: "Stüdyonu oluştur", desc: "Hizmetlerini, personelini ve çalışma saatlerini birkaç dakikada ekle." },
  { n: "2", title: "Linkini paylaş", desc: "Sana özel randevu linkini Instagram ve WhatsApp'ta paylaş." },
  { n: "3", title: "Yönet & büyü", desc: "Gelen randevuları panelden takip et, müşterilerini elde tut." },
];

const PLANS = [
  {
    name: "Başlangıç",
    price: "₺299",
    period: "/ay",
    desc: "Yeni açılan küçük stüdyolar için.",
    cta: "Başla",
    highlight: false,
    features: [
      "2 personele kadar",
      "Randevu yönetimi & takvim",
      "Online randevu sayfası",
      "500 müşteri kaydı",
      "E-posta desteği",
    ],
  },
  {
    name: "Profesyonel",
    price: "₺599",
    period: "/ay",
    desc: "Büyüyen stüdyolar için en popüler seçim.",
    cta: "Başla",
    highlight: true,
    features: [
      "8 personele kadar",
      "Vardiya planlama",
      "SMS & e-posta hatırlatma",
      "Analitik & raporlar",
      "Sınırsız müşteri",
      "Öncelikli destek",
    ],
  },
  {
    name: "İşletme",
    price: "₺1.199",
    period: "/ay",
    desc: "Çok şubeli, yoğun işletmeler için.",
    cta: "İletişime Geç",
    highlight: false,
    features: [
      "Sınırsız personel",
      "Çoklu şube yönetimi",
      "Gelişmiş analitik",
      "API erişimi",
      "Özel hesap yöneticisi",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFF5F9] text-[#1A0A14]">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-[#FFF5F9]/80 backdrop-blur-md border-b border-[#F3E0EB]">
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DB5E9B] flex items-center justify-center shadow-lg shadow-[#DB5E9B]/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-sm">NailStudio</p>
              <p className="text-[#DB5E9B] text-xs font-medium -mt-0.5">101</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="#fiyatlandirma" className="hidden sm:block text-sm font-medium text-[#6B1A45] hover:text-[#DB5E9B] px-3 py-2 transition-colors">
              Fiyatlar
            </Link>
            <Link href="/hesabim" className="hidden sm:block text-sm font-medium text-[#6B1A45] hover:text-[#DB5E9B] px-3 py-2 transition-colors">
              Randevularım
            </Link>
            <Link href="/auth/login" className="text-sm font-medium text-[#6B1A45] hover:text-[#DB5E9B] px-3 py-2 transition-colors">
              Giriş Yap
            </Link>
            <Link href="/auth/register" className="text-sm font-semibold bg-[#DB5E9B] hover:bg-[#C84B88] text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-[#DB5E9B]/20">
              Ücretsiz Başla
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <span className="inline-flex items-center gap-1.5 bg-[#FFF0F7] border border-[#DB5E9B]/20 text-[#DB5E9B] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Tırnak stüdyoları için tasarlandı
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
          Stüdyonuz için<br className="hidden sm:block" />{" "}
          <span className="text-[#DB5E9B]">akıllı randevu</span> sistemi
        </h1>
        <p className="mt-6 text-lg text-[#6B1A45] max-w-2xl mx-auto">
          Online randevu, müşteri ve personel yönetimi, vardiya takibi ve analitik —
          hepsi tek, sade bir panelde.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#DB5E9B] hover:bg-[#C84B88] text-white font-semibold px-7 py-3.5 rounded-2xl transition-all shadow-xl shadow-[#DB5E9B]/25 active:scale-95">
            Ücretsiz Başla <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#fiyatlandirma" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFFFFF] border border-[#F3E0EB] hover:border-[#DB5E9B] text-[#1A0A14] font-semibold px-7 py-3.5 rounded-2xl transition-all">
            Fiyatlandırma
          </Link>
        </div>
        <p className="mt-4 text-xs text-[#9CA3AF]">Kredi kartı gerekmez · Dakikalar içinde kurulum</p>
      </section>

      {/* Features */}
      <section className="bg-[#FFFFFF] border-y border-[#F3E0EB]">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Bir stüdyoyu yönetmek için her şey</h2>
            <p className="mt-3 text-[#6B1A45]">Dağınık defterleri ve karışık mesajları geride bırakın.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[#FFF5F9] border border-[#F3E0EB] rounded-2xl p-6 hover:border-[#DB5E9B]/40 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-[#DB5E9B]/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#DB5E9B]" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-1.5 text-sm text-[#6B1A45] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">3 adımda başla</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#DB5E9B] text-white font-bold text-lg flex items-center justify-center mx-auto shadow-lg shadow-[#DB5E9B]/25">
                {s.n}
              </div>
              <h3 className="mt-5 font-semibold text-lg">{s.title}</h3>
              <p className="mt-1.5 text-sm text-[#6B1A45] max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="fiyatlandirma" className="scroll-mt-20 bg-[#FFFFFF] border-y border-[#F3E0EB]">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Basit, şeffaf fiyatlandırma</h2>
            <p className="mt-3 text-[#6B1A45]">Stüdyona uygun planı seç, istediğin zaman yükselt.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl p-7 border ${
                  p.highlight
                    ? "border-[#DB5E9B] bg-[#FFF0F7] shadow-xl shadow-[#DB5E9B]/15 md:-mt-3"
                    : "border-[#F3E0EB] bg-[#FFFFFF]"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#DB5E9B] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg shadow-[#DB5E9B]/30 whitespace-nowrap">
                    En Popüler
                  </span>
                )}
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="text-sm text-[#6B1A45] mt-1 min-h-[40px]">{p.desc}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-[#9CA3AF] text-sm mb-1.5">{p.period}</span>
                </div>
                <Link
                  href="/auth/register"
                  className={`mt-6 w-full inline-flex items-center justify-center gap-2 font-semibold px-5 py-3 rounded-xl transition-all active:scale-95 ${
                    p.highlight
                      ? "bg-[#DB5E9B] hover:bg-[#C84B88] text-white shadow-lg shadow-[#DB5E9B]/25"
                      : "bg-[#FFFFFF] border border-[#F3E0EB] hover:border-[#DB5E9B] text-[#1A0A14]"
                  }`}
                >
                  {p.cta}
                </Link>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#1A0A14]">
                      <Check className="w-4 h-4 text-[#DB5E9B] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#9CA3AF] mt-10">
            Tüm planlarda 14 gün ücretsiz deneme · İstediğin zaman iptal et.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-24">
        <div className="bg-[#DB5E9B] rounded-3xl px-8 py-14 sm:py-16 text-center text-white shadow-2xl shadow-[#DB5E9B]/30">
          <h2 className="text-3xl sm:text-4xl font-bold">Bugün başlayın</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Stüdyonuzu kurun, randevu linkinizi paylaşın ve ilk online randevunuzu bugün alın.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFFFFF] text-[#DB5E9B] font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/90 transition-all active:scale-95">
              Ücretsiz Başla <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/10 transition-all">
              Giriş Yap
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Kurulum ücretsiz</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Online randevu dahil</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Sınırsız müşteri</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#F3E0EB] bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DB5E9B] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">NailStudio 101</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-[#6B1A45]">
            <Link href="/auth/login" className="hover:text-[#DB5E9B] transition-colors">Giriş</Link>
            <Link href="/auth/register" className="hover:text-[#DB5E9B] transition-colors">Kayıt</Link>
            <Link href="#fiyatlandirma" className="hover:text-[#DB5E9B] transition-colors">Fiyatlar</Link>
          </div>
          <p className="text-xs text-[#9CA3AF]">© {new Date().getFullYear()} NailStudio 101</p>
        </div>
      </footer>
    </div>
  );
}

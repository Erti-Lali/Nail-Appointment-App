// Auth sayfaları (login/register) için ortak marka görselleri.
// Renkler doğrudan yeni gül paletine sabitlenmiştir (koyu gradient panel üzerinde
// Tailwind tema override'ından bağımsız net hex kullanımı gerekir).

const BRAND_GRADIENT = "linear-gradient(135deg, #C4356A 0%, #9B2550 100%)";

// Nail-drop (oje damlası) ikonu.
export function NailDropLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5c.43 0 .83.2 1.1.54 1.98 2.5 5.65 7.5 5.65 10.86a6.75 6.75 0 1 1-13.5 0c0-3.36 3.67-8.36 5.65-10.86.27-.34.67-.54 1.1-.54Z" />
      <path
        d="M9.6 11.4c-.5 1-.8 2-.8 3.05"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.55"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Gradient kutu + damla — logo işareti. Mobil başlık ve koyu panelde kullanılır.
export function NailDropMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "w-12 h-12 rounded-2xl" : "w-9 h-9 rounded-xl";
  const icon = size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div
      className={`${box} flex items-center justify-center shrink-0`}
      style={{ background: BRAND_GRADIENT, boxShadow: "0 6px 18px rgba(196,53,106,0.40)" }}
    >
      <NailDropLogo className={`${icon} text-[#FFFFFF]`} />
    </div>
  );
}

// Dekoratif çiçek + nail-drop motifi (koyu panel için, düşük opaklık).
function DecorMotif() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-20 -right-16 w-80 h-80 rounded-full blur-3xl"
        style={{ background: "rgba(196,53,106,0.20)" }}
      />
      <div
        className="absolute bottom-0 -left-16 w-64 h-64 rounded-full blur-3xl"
        style={{ background: "rgba(229,166,185,0.10)" }}
      />
      {/* Çiçek motifi */}
      <svg
        className="absolute bottom-10 right-10 w-44 h-44 text-[#E5A6B9]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        style={{ opacity: 0.28 }}
      >
        <g>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <ellipse key={a} cx="50" cy="28" rx="7.5" ry="19" transform={`rotate(${a} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="5.5" />
        </g>
      </svg>
      {/* Dağınık küçük damlalar */}
      <NailDropLogo className="absolute top-24 left-12 w-6 h-6 text-[#E5A6B9]/20" />
      <NailDropLogo className="absolute top-1/2 right-24 w-4 h-4 text-[#E5A6B9]/15" />
    </div>
  );
}

// Sol marka paneli — mobilde gizli, masaüstünde tam yükseklik koyu gradient.
export function AuthBrandPanel({ heading, subtext }: { heading: string; subtext: string }) {
  return (
    <div
      className="hidden lg:flex relative flex-col justify-between w-1/2 p-12 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #2D0A1A 0%, #4A1528 100%)" }}
    >
      <DecorMotif />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <NailDropMark size="lg" />
        <span className="font-display text-xl font-bold tracking-[0.15em] text-[#FFFFFF]">
          NAILSTUDIO 101
        </span>
      </div>

      {/* Slogan */}
      <div className="relative max-w-md">
        <h2 className="font-display text-4xl font-bold leading-tight text-[#FFFFFF]">{heading}</h2>
        <p className="mt-4 text-[#E5A6B9] text-sm leading-relaxed">{subtext}</p>
      </div>

      {/* Footer */}
      <p className="relative text-[13px] text-[#E5A6B9]" style={{ opacity: 0.55 }}>
        © 2026 NailStudio 101 · Tüm hakları saklıdır
      </p>
    </div>
  );
}

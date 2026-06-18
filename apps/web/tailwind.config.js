/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Override white → dark text so text-white reads well on light bg
        white: "#1A0A14",

        // Pink palette — used everywhere via gold-* class names
        gold: {
          50:  "#FFF0F7",
          100: "#FFD6EC",
          200: "#FFB3D9",
          300: "#FF85C0",
          400: "#F49AC2",
          500: "#DB5E9B",   // primary brand pink
          600: "#C84B88",
          700: "#9E0E57",
          800: "#7A0940",
          900: "#560529",
        },

        // Light palette — used everywhere via black-* class names
        black: {
          DEFAULT: "#FFF5F9",  // page background
          soft:    "#FEF0F5",  // input background
          card:    "#FFFFFF",  // card background
          border:  "#F3E0EB",  // borders
          muted:   "#E8D0DD",  // muted elements
        },

        status: {
          pending:    "#F59E0B",
          confirmed:  "#22C55E",
          inProgress: "#3B82F6",
          completed:  "#6B7280",
          canceled:   "#EF4444",
          noShow:     "#EC4899",
        },

        // ── Semantic tokens (single source of truth — prefer these) ──
        // bg-brand, text-brand, hover:bg-brand-dark, bg-brand-soft …
        brand: {
          DEFAULT: "#DB5E9B", // primary
          dark:    "#C84B88", // hover/active
          soft:    "#FFF0F7", // tinted surfaces
        },
        surface: {
          DEFAULT: "#FFFFFF", // cards
          soft:    "#FEF0F5", // inputs / muted panels
        },
        canvas: "#FFF5F9",    // page background
        line:   "#F3E0EB",    // borders
        ink: {
          DEFAULT: "#1A0A14", // primary text
          muted:   "#6B1A45", // secondary text
          subtle:  "#9CA3AF", // tertiary / placeholder
        },
      },

      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },

      backgroundImage: {
        "gold-gradient":  "linear-gradient(135deg, #DB5E9B 0%, #F49AC2 50%, #DB5E9B 100%)",
        "dark-gradient":  "linear-gradient(135deg, #FFF5F9 0%, #FFF0F5 100%)",
        "card-gradient":  "linear-gradient(135deg, #FFFFFF 0%, #FFF5F9 100%)",
      },

      boxShadow: {
        gold:      "0 4px 20px rgba(219, 94, 155, 0.25)",
        "gold-lg": "0 8px 40px rgba(219, 94, 155, 0.35)",
        card:      "0 2px 16px rgba(219, 94, 155, 0.06)",
      },

      animation: {
        "fade-in":  "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        shimmer:    "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },

      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

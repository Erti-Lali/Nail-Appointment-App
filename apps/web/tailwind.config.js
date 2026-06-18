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
        // All theme colors derive from CSS variables defined in
        // src/app/nailstudio-theme-variables.css (single source of truth).
        // The `rgb(var(--x) / <alpha-value>)` form keeps opacity modifiers
        // (e.g. bg-brand/20) working.

        // Override white → dark text so text-white reads well on light bg
        white: "rgb(var(--ns-ink) / <alpha-value>)",

        // Pink palette — legacy gold-* class names (now var-backed)
        gold: {
          50:  "rgb(var(--ns-brand-soft) / <alpha-value>)",
          100: "#FFD6EC",
          200: "#FFB3D9",
          300: "#FF85C0",
          400: "rgb(var(--ns-brand-light) / <alpha-value>)",
          500: "rgb(var(--ns-brand) / <alpha-value>)",   // primary brand pink
          600: "rgb(var(--ns-brand-dark) / <alpha-value>)",
          700: "#9E0E57",
          800: "#7A0940",
          900: "#560529",
        },

        // Light palette — legacy black-* class names (now var-backed)
        black: {
          DEFAULT: "rgb(var(--ns-canvas) / <alpha-value>)",       // page background
          soft:    "rgb(var(--ns-surface-soft) / <alpha-value>)", // input background
          card:    "rgb(var(--ns-surface) / <alpha-value>)",      // card background
          border:  "rgb(var(--ns-line) / <alpha-value>)",         // borders
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
          DEFAULT: "rgb(var(--ns-brand) / <alpha-value>)",
          dark:    "rgb(var(--ns-brand-dark) / <alpha-value>)",
          light:   "rgb(var(--ns-brand-light) / <alpha-value>)",
          soft:    "rgb(var(--ns-brand-soft) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--ns-surface) / <alpha-value>)",
          soft:    "rgb(var(--ns-surface-soft) / <alpha-value>)",
        },
        canvas: "rgb(var(--ns-canvas) / <alpha-value>)",
        line:   "rgb(var(--ns-line) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ns-ink) / <alpha-value>)",
          muted:   "rgb(var(--ns-ink-muted) / <alpha-value>)",
          subtle:  "rgb(var(--ns-ink-subtle) / <alpha-value>)",
        },
        overlay: "rgb(var(--ns-overlay) / 0.4)",
      },

      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },

      backgroundImage: {
        "gold-gradient":  "linear-gradient(135deg, rgb(var(--ns-brand)) 0%, rgb(var(--ns-brand-light)) 50%, rgb(var(--ns-brand)) 100%)",
        "dark-gradient":  "linear-gradient(135deg, rgb(var(--ns-canvas)) 0%, rgb(var(--ns-brand-soft)) 100%)",
        "card-gradient":  "linear-gradient(135deg, rgb(var(--ns-surface)) 0%, rgb(var(--ns-canvas)) 100%)",
      },

      boxShadow: {
        gold:      "0 4px 20px rgb(var(--ns-brand) / 0.25)",
        "gold-lg": "0 8px 40px rgb(var(--ns-brand) / 0.35)",
        card:      "0 2px 16px rgb(var(--ns-brand) / 0.06)",
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

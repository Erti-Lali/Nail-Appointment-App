import type { Metadata, Viewport } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NailStudio 101 — Profesyonel Randevu Sistemi",
    template: "%s | NailStudio 101",
  },
  description: "Tırnak stüdyoları için akıllı randevu ve müşteri yönetim sistemi",
  keywords: ["nail studio", "tırnak", "randevu", "yönetim", "SaaS"],
  authors: [{ name: "NailStudio 101" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "NailStudio 101",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#C4356A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${jost.variable} ${cormorant.variable}`}>
      <body className="bg-black text-white antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#FFFFFF",
                border: "1px solid #F0DDE5",
                color: "#2D0A1A",
                fontFamily: "var(--font-inter)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

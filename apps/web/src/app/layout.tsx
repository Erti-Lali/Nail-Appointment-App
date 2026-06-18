import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
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
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-black text-white antialiased">
        <Providers>
          {children}
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "#1A1A1A",
                border: "1px solid #2A2A2A",
                color: "#FAFAFA",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

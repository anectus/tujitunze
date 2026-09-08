import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/context/LanguageContext";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tujitunze — Health Savings & Insurance Management System",
  description:
    "Tujitunze is a health savings and insurance management platform for Tanzania — save toward healthcare costs, contribute through telecom or bank, and access insurance coverage for care.",
};

// This app Router has no app/head.tsx (that was a pre-13.4 convention,
// removed since) and no index.html (this isn't a static/CRA build) — the
// `viewport` export here is the current, correct place for viewport
// config; Next.js injects the actual <meta name="viewport"> tag from it.
// viewportFit: "cover" is what makes env(safe-area-inset-*) resolve to
// real, non-zero values on a notched/rounded-corner device instead of 0 —
// every safe-area CSS change elsewhere in this codebase depends on this
// one setting being present.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

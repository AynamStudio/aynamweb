import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import PublicChrome from "@/components/chrome/PublicChrome";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://aynam.in"),
  title: {
    default: "AYNAM — Ideas to Impact. Through Better Software.",
    template: "%s — AYNAM",
  },
  description:
    "AYNAM is an independent software studio. We design, build and modernize software systems, AI-powered products and internal tools that help businesses work smarter and grow faster.",
  keywords: ["software studio", "web development", "AI automation", "legacy modernization", "AYNAM"],
  openGraph: {
    type: "website",
    siteName: "AYNAM",
    title: "AYNAM — Ideas to Impact. Through Better Software.",
    description:
      "Independent software studio. We design, build and modernize software systems that help businesses work smarter and grow faster.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="grain bg-ink-950 font-sans text-fog antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[130] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-xs focus:text-ink-950"
        >
          Skip to content
        </a>
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}

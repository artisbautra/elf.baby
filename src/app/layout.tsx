import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Snowfall } from "@/components/ui/Snowfall";
import { HeaderProvider } from "@/contexts/HeaderContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display" });

export const metadata: Metadata = {
  title: "elf.baby | Curated Gifts for Everyone",
  description: "Find the perfect gift for your loved ones, from babies to adults.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-cream text-slate-900 relative`}>
        {analyticsEnabled && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id="cacea6b3-28ad-4f01-bbc2-722206b4bf38"
            strategy="afterInteractive"
          />
        )}
        <HeaderProvider>
          <Snowfall />
          {children}
        </HeaderProvider>
      </body>
    </html>
  );
}

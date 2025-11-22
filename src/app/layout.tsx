import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Snowfall } from "@/components/ui/Snowfall";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display" });

export const metadata: Metadata = {
  title: "elf.baby | Curated Gifts for Everyone",
  description: "Find the perfect gift for your loved ones, from babies to adults.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-cream text-slate-900 relative`}>
        <Snowfall />
        {children}
      </body>
    </html>
  );
}

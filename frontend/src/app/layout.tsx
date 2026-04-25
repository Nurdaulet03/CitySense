import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/layout/Navbar";
import { GlobalErrorSuppressor } from "@/components/layout/GlobalErrorSuppressor";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "CitySense — Smart Urban Life Platform",
  description:
    "AI-powered smart city platform with real-time air quality, traffic, weather monitoring and intelligent recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen`}>
        <GlobalErrorSuppressor />
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}

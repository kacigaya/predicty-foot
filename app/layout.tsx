import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Geist, JetBrains_Mono } from "next/font/google";
import { connection } from "next/server";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Predicty Foot — Soccer Predictions",
  description:
    "Live bookmaker odds fused with AI analysis. Scorelines, confidence, and value bets for Europe's top leagues.",
  keywords: ["football", "soccer", "predictions", "odds", "betting"],
};

export const viewport: Viewport = {
  themeColor: "#0a0a09",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();

  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geist.variable} ${jetbrains.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a09] text-[#f4efe2] selection:bg-[#d8ff3e] selection:text-[#0a0a09]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#131311",
              border: "1px solid #2a2a25",
              borderLeft: "2px solid #d8ff3e",
              borderRadius: "0px",
              color: "#f4efe2",
              fontFamily: "var(--font-geist)",
            },
          }}
        />
      </body>
    </html>
  );
}

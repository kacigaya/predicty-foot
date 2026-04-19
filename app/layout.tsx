import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
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
  themeColor: "#0e1117",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-[#0e1117] text-[#e4e8ee] selection:bg-amber-500/25">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#161b22",
              border: "1px solid #252d3a",
              color: "#e4e8ee",
            },
          }}
        />
      </body>
    </html>
  );
}

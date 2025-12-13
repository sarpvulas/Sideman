import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Sideman",
  description:
    "Learn jazz piano chords and voicings with AI-powered feedback and coaching",
  keywords: ["jazz", "piano", "music education", "chord voicings", "AI tutor", "sideman"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-primary-900">
        <Header />
        {children}
      </body>
    </html>
  );
}

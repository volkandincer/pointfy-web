import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ScrollLockCleanup from "@/components/layout/ScrollLockCleanup";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeamHubX",
  description:
    "Poker planning, retrospektif toplantıları ve görev yönetimi ile takımınızı bir araya getirin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ScrollLockCleanup />
        {children}
      </body>
    </html>
  );
}

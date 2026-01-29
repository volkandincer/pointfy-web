import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası | Pointfy",
  description: "Pointfy çerez politikası: hangi çerezleri neden kullanıyoruz.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası | TeamHubX",
  description: "TeamHubX çerez politikası: hangi çerezleri neden kullanıyoruz.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


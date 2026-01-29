import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Pointfy",
  description:
    "Pointfy gizlilik politikası: hangi verileri topluyoruz ve nasıl koruyoruz.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Şartları | Pointfy",
  description: "Pointfy kullanım şartları: hizmet koşulları ve sorumluluklar.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


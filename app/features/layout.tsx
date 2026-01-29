import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Özellikler | Pointfy",
  description:
    "Pointfy özellikleri: takım odaları, poker planning, retrospektif, görev yönetimi ve gerçek zamanlı işbirliği.",
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


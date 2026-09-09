import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fiyatlandırma | TeamHubX",
  description: "TeamHubX fiyatlandırma seçenekleri ve planlar.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


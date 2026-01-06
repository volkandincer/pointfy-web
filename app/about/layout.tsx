import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkında | TeamHubX",
  description:
    "TeamHubX hakkında bilgi edinin: takım işbirliği, poker planning, retrospektif ve görev yönetimi.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


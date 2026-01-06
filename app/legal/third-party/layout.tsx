import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Üçüncü Taraf Hizmetler | TeamHubX",
  description: "TeamHubX tarafından kullanılan üçüncü taraf hizmetler.",
  alternates: { canonical: "/legal/third-party" },
};

export default function ThirdPartyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


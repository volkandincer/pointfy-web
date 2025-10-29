import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Özellikler | Pointfy",
  description:
    "Pointfy özellikleri: takım odaları, poker planning, retrospektif, görev yönetimi ve gerçek zamanlı işbirliği.",
};

export default function FeaturesPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Özellikler
          </h1>
          <ul className="list-disc space-y-2 pl-6 text-gray-600 dark:text-gray-400">
            <li>Takım Odaları</li>
            <li>Poker Planning</li>
            <li>Retrospektif</li>
            <li>Görev Yönetimi</li>
            <li>Gerçek Zamanlı Senkronizasyon</li>
          </ul>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

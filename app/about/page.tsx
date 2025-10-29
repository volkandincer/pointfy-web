import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Hakkında | Pointfy",
  description:
    "Pointfy hakkında bilgi edinin: takım işbirliği, poker planning, retrospektif ve görev yönetimi.",
};

export default function AboutPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Hakkında
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pointfy, ekiplerin planlama, geri bildirim ve görev yönetimi
            süreçlerini tek bir yerde toplamasına yardımcı olan modern bir takım
            işbirliği platformudur.
          </p>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

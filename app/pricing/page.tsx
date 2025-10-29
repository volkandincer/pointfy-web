import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fiyatlandırma | Pointfy",
  description: "Pointfy fiyatlandırma seçenekleri ve planlar.",
};

export default function PricingPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Fiyatlandırma
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Şu anda tek bir plan sunuyoruz: Erken erişim sürecinde ücretsiz.
            Yakında farklı planlar ve kurumsal seçenekler eklenecektir.
          </p>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

"use client";

import { DollarSign } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export default function PricingPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <PageHeader
            title="Fiyatlandırma"
            description="Şu anda tek bir plan sunuyoruz: Erken erişim sürecinde ücretsiz. Yakında farklı planlar ve kurumsal seçenekler eklenecektir."
            icon={DollarSign}
            iconColor="blue"
          />
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

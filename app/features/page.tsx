"use client";

import { Zap } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export default function FeaturesPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <PageHeader
            title="Özellikler"
            icon={Zap}
            iconColor="blue"
          />
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

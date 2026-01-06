"use client";

import { Info } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export default function AboutPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <PageHeader
            title="Hakkında"
            description="TeamHubX, ekiplerin planlama, geri bildirim ve görev yönetimi süreçlerini tek bir yerde toplamasına yardımcı olan modern bir takım işbirliği platformudur."
            icon={Info}
            iconColor="blue"
          />
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

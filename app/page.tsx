"use client";

import { useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import CTA from "@/components/sections/CTA";
import type { Feature } from "@/interfaces/Feature.interface";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

export default function HomePage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => [
      { label: "Ana Sayfa", href: "/" },
      { label: "Özellikler", href: "/#features" },
      { label: "İndir", href: "/#download" },
    ],
    []
  );

  const features: Feature[] = useMemo(
    () => [
      {
        id: "1",
        title: "Takım Odaları",
        description:
          "Takımınız için özel odalar oluşturun ve üyelerinizi organize edin.",
      },
      {
        id: "2",
        title: "Poker Planning",
        description:
          "Görevleri oylayarak daha iyi planlama yapın ve tahminlerinizi güçlendirin.",
      },
      {
        id: "3",
        title: "Retrospektif",
        description:
          "Takım performansınızı değerlendirin ve sürekli iyileştirme yapın.",
      },
      {
        id: "4",
        title: "Görev Yönetimi",
        description:
          "Not alın, görevler oluşturun ve takımınızla işbirliği yapın.",
      },
      {
        id: "5",
        title: "Gerçek Zamanlı Senkronizasyon",
        description:
          "Supabase Realtime ile anında güncellemeler alın ve değişiklikleri takip edin.",
      },
      {
        id: "6",
        title: "Kolay Kullanım",
        description:
          "Sezgisel arayüz ve modern tasarım ile takım yönetimi çok daha kolay.",
      },
    ],
    []
  );

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main>
        <Hero />
        <Features features={features} />
        <CTA />
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

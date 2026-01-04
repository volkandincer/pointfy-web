"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RecentRooms from "@/components/sections/RecentRooms";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

export default function RoomsPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="pb-8">
        <div className="container mx-auto px-4 pt-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Aktif Odalar
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Mevcut odalara katılın veya yeni bir oda oluşturun
            </p>
          </div>
        </div>
        <RecentRooms />
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

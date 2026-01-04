"use client";

import { DoorOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import RecentRooms from "@/components/sections/RecentRooms";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

export default function RoomsPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <PageHeader
            title="Aktif Odalar"
            description="Mevcut odalara katılın veya yeni bir oda oluşturun"
            icon={DoorOpen}
            iconColor="blue"
          />
          <RecentRooms />
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

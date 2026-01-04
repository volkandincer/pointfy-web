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
      <main className="pb-8">
        <div className="container mx-auto px-4 pt-8">
          <PageHeader
            title="Aktif Odalar"
            description="Mevcut odalara katılın veya yeni bir oda oluşturun"
            icon={DoorOpen}
            iconColor="blue"
          />
        </div>
        <RecentRooms />
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

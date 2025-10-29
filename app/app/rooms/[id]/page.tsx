"use client";

import { useParams } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

export default function RoomDetailPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  const params = useParams<{ id: string }>();
  const roomId = params?.id;

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Oda Detayı</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Room ID: {String(roomId)}</p>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Bu sayfa ilerleyen adımda görevler/oylar/retro ile doldurulacak.</p>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}



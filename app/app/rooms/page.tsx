"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

export default function RoomsPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            Odalar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Korumalı örnek sayfa. İçeriği sonraki adımda dolduracağız.
          </p>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}

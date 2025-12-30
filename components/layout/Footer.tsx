"use client";

import Link from "next/link";
import { memo } from "react";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

interface FooterProps {
  navigationItems: NavigationItem[];
}

const Footer = memo(function Footer({ navigationItems }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="mb-4 text-lg font-bold text-foreground">TeamHubX</h3>
            <p className="text-sm text-muted-foreground">
              Takım işbirliği için güçlü bir platform. Poker planning,
              retrospektif toplantıları ve görev yönetimi araçları.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Sayfalar
            </h4>
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Yasal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/third-party"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Üçüncü Taraf Hizmetler
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t-2 border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {currentYear} TeamHubX. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;

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
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Pointfy
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Takım işbirliği için güçlü bir platform. Poker planning,
              retrospektif toplantıları ve görev yönetimi araçları.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Sayfalar
            </h4>
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
            <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
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
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
          <p>© {currentYear} Pointfy. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Çerez Politikası | Pointfy",
  description: "Pointfy çerez politikası: hangi çerezleri neden kullanıyoruz.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">
            Çerez Politikası
          </h1>
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy web sitesi, hizmetlerimizi iyileştirmek ve size daha iyi
              bir deneyim sunmak için çerezler kullanmaktadır.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Çerez Nedir?
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Çerezler, web sitelerinin tarayıcınıza kaydettiği küçük metin
              dosyalarıdır. Bu dosyalar, sitenin daha sonraki ziyaretlerinizde
              sizi tanımasını sağlar.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Kullandığımız Çerezler
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, aşağıdaki türde çerezler kullanmaktadır:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Gerekli Çerezler:</strong> Sitenin temel işlevleri için
                zorunludur.
              </li>
              <li>
                <strong>Analitik Çerezler:</strong> Site kullanımını anlamak
                için kullanılır.
              </li>
              <li>
                <strong>İşlevsellik Çerezler:</strong> Tercihlerinizi hatırlamak
                için kullanılır.
              </li>
            </ul>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Çerez Yönetimi
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Tarayıcı ayarlarınızdan çerezleri yönetebilir veya
              engelleyebilirsiniz. Ancak bazı çerezleri devre dışı bırakmak,
              sitenin bazı özelliklerinin çalışmamasına neden olabilir.
            </p>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

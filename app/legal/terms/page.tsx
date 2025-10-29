import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kullanım Şartları | Pointfy",
  description: "Pointfy kullanım şartları: hizmet koşulları ve sorumluluklar.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">
            Kullanım Şartları
          </h1>
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy uygulamasını kullanarak aşağıdaki kullanım şartlarını
              kabul etmiş sayılırsınız.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Kullanım Koşulları
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy uygulamasını yalnızca yasal ve meşru amaçlar için
              kullanabilirsiniz. Uygulamayı kötüye kullanmak, zararlı içerik
              paylaşmak veya başkalarının haklarını ihlal etmek yasaktır.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Hesap Güvenliği
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi güvende
              tutun ve başkalarıyla paylaşmayın.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Hizmet Kesintileri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, bakım, güncelleme veya teknik sorunlar nedeniyle hizmet
              kesintileri yaşayabilir. Bu durumlardan sorumlu tutulamayız.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Değişiklikler
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu kullanım şartlarını istediğimiz zaman güncelleyebiliriz. Önemli
              değişiklikler kullanıcılara bildirilecektir.
            </p>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

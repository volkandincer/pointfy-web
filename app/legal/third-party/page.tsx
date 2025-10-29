import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

const navigationItems: NavigationItem[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Özellikler", href: "/#features" },
  { label: "İndir", href: "/#download" },
];

export default function ThirdPartyPage() {
  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">
            Üçüncü Taraf Hizmetler
          </h1>
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, hizmetlerini sağlamak için aşağıdaki üçüncü taraf
              hizmetleri kullanmaktadır.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Supabase
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, veri depolama ve gerçek zamanlı işbirliği özellikleri
              için Supabase platformunu kullanmaktadır. Supabase&apos;in
              gizlilik politikası için{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline dark:text-blue-400"
              >
                Supabase Gizlilik Politikası
              </a>{" "}
              sayfasını ziyaret edebilirsiniz.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Hosting ve CDN
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Web sitesi, modern hosting ve CDN hizmetleri kullanılarak
              yayınlanmaktadır. Bu hizmetler, site performansını artırmak ve
              içeriği hızlı bir şekilde sunmak için kullanılmaktadır.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Analytics (İsteğe Bağlı)
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              İsteğe bağlı olarak, site kullanımını anlamak için analytics
              hizmetleri kullanılabilir. Bu hizmetler, anonim kullanım
              verilerini toplar ve kişisel bilgi içermez.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Veri Paylaşımı
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, yukarıda belirtilen hizmetler dışında verilerinizi üçüncü
              taraflarla paylaşmaz. Tüm veri işlemleri, bu hizmetlerin gizlilik
              politikalarına uygun olarak gerçekleştirilir.
            </p>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

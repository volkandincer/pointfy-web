import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Üçüncü Taraf Hizmetler | Pointfy",
  description: "Pointfy tarafından kullanılan üçüncü taraf hizmetler.",
  alternates: { canonical: "/legal/third-party" },
};

export default function ThirdPartyPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
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
              <strong>Son Güncelleme:</strong> {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, hizmetlerini sağlamak için aşağıdaki üçüncü taraf
              hizmetleri kullanmaktadır. Bu hizmetler, verilerinizin işlenmesi
              ve saklanması konusunda rol oynayabilir.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Veri Depolama ve Altyapı Hizmetleri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, veri depolama, gerçek zamanlı işbirliği özellikleri ve
              kimlik doğrulama için güvenli bulut altyapı hizmetleri
              kullanmaktadır. Bu hizmetler:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>Verilerinizi güvenli bir şekilde saklar</li>
              <li>Gerçek zamanlı senkronizasyon sağlar</li>
              <li>Kimlik doğrulama ve yetkilendirme işlemlerini yönetir</li>
              <li>Endüstri standardı şifreleme ve güvenlik önlemleri uygular</li>
            </ul>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu hizmet sağlayıcıların gizlilik politikaları, verilerinizin
              nasıl işlendiğini detaylandırır. İlgili gizlilik politikalarını
              incelemek için hizmet sağlayıcıların web sitelerini ziyaret
              edebilirsiniz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Hosting ve CDN Hizmetleri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Web sitesi, modern hosting ve içerik dağıtım ağı (CDN) hizmetleri
              kullanılarak yayınlanmaktadır. Bu hizmetler:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>Site performansını artırır</li>
              <li>İçeriği hızlı bir şekilde sunar</li>
              <li>Dünya çapında erişilebilirlik sağlar</li>
              <li>Güvenlik ve DDoS koruması sağlar</li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Analytics ve İstatistik Hizmetleri (İsteğe Bağlı)
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              İsteğe bağlı olarak, site kullanımını anlamak ve hizmetlerimizi
              iyileştirmek için analytics hizmetleri kullanılabilir. Bu
              hizmetler:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>Anonim kullanım verilerini toplar</li>
              <li>Kişisel bilgi içermez</li>
              <li>Site performansını ve kullanıcı deneyimini analiz eder</li>
              <li>Hizmet iyileştirmeleri için veri sağlar</li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Veri İşleme ve Güvenlik
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Tüm üçüncü taraf hizmet sağlayıcılarımız:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>Endüstri standardı güvenlik önlemleri uygular</li>
              <li>Veri şifreleme kullanır</li>
              <li>Düzenli güvenlik denetimleri yapar</li>
              <li>Veri koruma yasalarına uyum sağlar</li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Veri Paylaşımı ve Aktarımı
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, yukarıda belirtilen hizmetler dışında verilerinizi üçüncü
              taraflarla paylaşmaz. Tüm veri işlemleri, bu hizmetlerin gizlilik
              politikalarına ve veri koruma yasalarına uygun olarak
              gerçekleştirilir.
            </p>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Verileriniz, hizmet sağlayıcılarımız aracılığıyla AB dışına
              aktarılabilir. Bu durumda, yeterli koruma önlemleri alınır ve
              standart sözleşme maddeleri uygulanır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Hizmet Sağlayıcı Değişiklikleri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Hizmet sağlayıcılarımızı zaman zaman değiştirebiliriz. Önemli
              değişiklikler kullanıcılara bildirilecektir. Güncel hizmet
              sağlayıcı listesi bu sayfada yayınlanmaktadır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Kullanıcı Hakları
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Üçüncü taraf hizmetlerle ilgili veri haklarınız,{" "}
              <a
                href="/legal/privacy"
                className="text-blue-600 underline dark:text-blue-400"
              >
                Gizlilik Politikamız
              </a>{" "}
              kapsamında korunmaktadır. Veri haklarınızı kullanmak için
              bizimle iletişime geçebilirsiniz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              8. İletişim
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Üçüncü taraf hizmetler hakkında sorularınız için bizimle iletişime
              geçebilirsiniz. İletişim bilgileri için{" "}
              <a
                href="/contact"
                className="text-blue-600 underline dark:text-blue-400"
              >
                İletişim
              </a>{" "}
              sayfasını ziyaret edebilirsiniz.
            </p>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

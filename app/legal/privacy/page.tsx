import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

const navigationItems: NavigationItem[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Özellikler", href: "/#features" },
  { label: "İndir", href: "/#download" },
];

export default function PrivacyPage() {
  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">
            Gizlilik Politikası
          </h1>
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu gizlilik politikası, Pointfy uygulamasını kullandığınızda
              kişisel verilerinizin nasıl toplandığını, kullanıldığını ve
              korunduğunu açıklamaktadır.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Veri Toplama
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, hizmetlerimizi sağlamak için gerekli olan minimum düzeyde
              veri toplamaktadır. Topladığımız veriler arasında:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>Email adresi (hesap oluşturma için)</li>
              <li>
                Takım odaları ve görev verileri (uygulama içi kullanım için)
              </li>
              <li>Kullanım istatistikleri (hizmet iyileştirme için)</li>
            </ul>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Veri Kullanımı
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Topladığımız veriler, hizmetlerimizi sağlamak, geliştirmek ve
              iyileştirmek için kullanılmaktadır. Verileriniz asla üçüncü
              taraflarla paylaşılmaz.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              Veri Güvenliği
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Verileriniz Supabase platformu üzerinde güvenli bir şekilde
              saklanmaktadır. Endüstri standardı şifreleme ve güvenlik önlemleri
              uygulanmaktadır.
            </p>
            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              İletişim
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime
              geçebilirsiniz.
            </p>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

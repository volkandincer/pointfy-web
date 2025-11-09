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
              <strong>Son Güncelleme:</strong> {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy web sitesi, hizmetlerimizi iyileştirmek ve size daha iyi
              bir deneyim sunmak için çerezler kullanmaktadır. Bu politika,
              hangi çerezleri kullandığımızı ve bunları nasıl yönetebileceğinizi
              açıklamaktadır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Çerez Nedir?
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Çerezler, web sitelerinin tarayıcınıza kaydettiği küçük metin
              dosyalarıdır. Bu dosyalar, sitenin daha sonraki ziyaretlerinizde
              sizi tanımasını, tercihlerinizi hatırlamasını ve site deneyiminizi
              iyileştirmesini sağlar.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Kullandığımız Çerez Türleri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, aşağıdaki türde çerezler kullanmaktadır:
            </p>

            <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
              2.1. Gerekli Çerezler
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu çerezler, sitenin temel işlevleri için zorunludur ve sitenin
              çalışması için gereklidir. Bu çerezler olmadan sitenin bazı
              özellikleri çalışmayabilir.
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Kimlik Doğrulama Çerezleri:</strong> Giriş yapmış
                kullanıcıları tanımak için
              </li>
              <li>
                <strong>Güvenlik Çerezleri:</strong> Güvenlik ve dolandırıcılık
                önleme için
              </li>
              <li>
                <strong>Oturum Çerezleri:</strong> Kullanıcı oturumlarını
                yönetmek için
              </li>
            </ul>

            <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
              2.2. İşlevsellik Çerezleri
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu çerezler, tercihlerinizi hatırlamak ve size kişiselleştirilmiş
              bir deneyim sunmak için kullanılır.
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Dil Tercihi:</strong> Seçtiğiniz dil tercihini hatırlamak
                için
              </li>
              <li>
                <strong>Tema Tercihi:</strong> Açık/koyu tema tercihinizi
                hatırlamak için
              </li>
              <li>
                <strong>Kullanıcı Ayarları:</strong> Diğer kullanıcı tercihlerini
                hatırlamak için
              </li>
            </ul>

            <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
              2.3. Analitik Çerezler
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu çerezler, site kullanımını anlamak ve hizmetlerimizi
              iyileştirmek için kullanılır. Bu çerezler anonim veri toplar ve
              kişisel bilgi içermez.
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Kullanım İstatistikleri:</strong> Sayfa görüntüleme,
                ziyaret süresi vb.
              </li>
              <li>
                <strong>Hata Takibi:</strong> Teknik hataları tespit etmek için
              </li>
              <li>
                <strong>Performans Metrikleri:</strong> Site performansını
                ölçmek için
              </li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Çerez Saklama Süreleri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Çerezler, saklama sürelerine göre iki kategoriye ayrılır:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Oturum Çerezleri:</strong> Tarayıcınızı kapattığınızda
                otomatik olarak silinir
              </li>
              <li>
                <strong>Kalıcı Çerezler:</strong> Belirli bir süre boyunca
                (genellikle 12 ay) tarayıcınızda kalır
              </li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Üçüncü Taraf Çerezler
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Hizmetlerimiz, üçüncü taraf hizmet sağlayıcıların çerezlerini
              içerebilir. Bu çerezler, ilgili hizmet sağlayıcının gizlilik
              politikasına tabidir. Daha fazla bilgi için{" "}
              <a
                href="/legal/third-party"
                className="text-blue-600 underline dark:text-blue-400"
              >
                Üçüncü Taraf Hizmetler
              </a>{" "}
              sayfasını ziyaret edebilirsiniz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Çerez Yönetimi
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Tarayıcı ayarlarınızdan çerezleri yönetebilir veya
              engelleyebilirsiniz. Ancak bazı çerezleri devre dışı bırakmak,
              sitenin bazı özelliklerinin çalışmamasına neden olabilir.
            </p>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Popüler tarayıcılarda çerez ayarlarına nasıl erişeceğiniz:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Chrome:</strong> Ayarlar → Gizlilik ve güvenlik →
                Çerezler ve diğer site verileri
              </li>
              <li>
                <strong>Firefox:</strong> Seçenekler → Gizlilik ve Güvenlik →
                Çerezler ve Site Verileri
              </li>
              <li>
                <strong>Safari:</strong> Tercihler → Gizlilik → Çerezler
              </li>
              <li>
                <strong>Edge:</strong> Ayarlar → Gizlilik, arama ve hizmetler →
                Çerezler ve site izinleri
              </li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Çerez Onayı
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Gerekli çerezler dışındaki çerezler için onayınızı alırız. İlk
              ziyaretinizde veya çerez tercihlerinizi değiştirdiğinizde çerez
              onay ekranı görüntülenir.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Çerez Politikası Değişiklikleri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu çerez politikasını zaman zaman güncelleyebiliriz. Önemli
              değişiklikler kullanıcılara bildirilecektir. Güncel politika
              her zaman bu sayfada yayınlanmaktadır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              8. İletişim
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Çerez politikamız hakkında sorularınız için bizimle iletişime
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

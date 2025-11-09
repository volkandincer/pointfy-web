import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Pointfy",
  description:
    "Pointfy gizlilik politikası: hangi verileri topluyoruz ve nasıl koruyoruz.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
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
              <strong>Son Güncelleme:</strong> {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu gizlilik politikası, Pointfy uygulamasını kullandığınızda
              kişisel verilerinizin nasıl toplandığını, kullanıldığını ve
              korunduğunu açıklamaktadır. Bu politikayı dikkatlice okuyun.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Veri Sorumlusu
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, kişisel verilerinizin veri sorumlusudur. Bu politika
              kapsamındaki tüm veri işleme faaliyetlerinden sorumluyuz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Toplanan Veriler
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, hizmetlerimizi sağlamak için gerekli olan minimum düzeyde
              veri toplamaktadır. Topladığımız veriler arasında:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Hesap Bilgileri:</strong> Email adresi, kullanıcı adı
                (hesap oluşturma ve kimlik doğrulama için)
              </li>
              <li>
                <strong>Uygulama Verileri:</strong> Takım odaları, görevler,
                notlar, oylar ve diğer uygulama içi içerik
              </li>
              <li>
                <strong>Kullanım Verileri:</strong> IP adresi, tarayıcı türü,
                cihaz bilgileri, erişim zamanları (hizmet iyileştirme ve güvenlik
                için)
              </li>
              <li>
                <strong>İletişim Verileri:</strong> Destek talepleri ve geri
                bildirimler
              </li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Veri İşleme Amaçları
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>Hizmetlerimizi sağlamak ve yönetmek</li>
              <li>Hesap oluşturma ve kimlik doğrulama</li>
              <li>Kullanıcı deneyimini iyileştirmek</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              <li>Kullanıcı desteği sağlamak</li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Veri İşleme Hukuki Dayanakları
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Kişisel verileriniz aşağıdaki hukuki dayanaklara göre işlenmektedir:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Sözleşmenin İfası:</strong> Hizmetlerimizi sağlamak için
                gerekli veriler
              </li>
              <li>
                <strong>Yasal Yükümlülük:</strong> Yasalara uyum için gerekli
                veriler
              </li>
              <li>
                <strong>Meşru Menfaat:</strong> Hizmet iyileştirme ve güvenlik
                için veriler
              </li>
              <li>
                <strong>Rıza:</strong> İsteğe bağlı özellikler için açık rıza
              </li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Veri Saklama Süreleri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca
              saklanır:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Hesap Verileri:</strong> Hesabınız aktif olduğu sürece
                veya silinene kadar
              </li>
              <li>
                <strong>Uygulama İçeriği:</strong> Hesabınız silinene kadar veya
                siz silene kadar
              </li>
              <li>
                <strong>Kullanım Logları:</strong> Maksimum 12 ay
              </li>
              <li>
                <strong>Yasal Yükümlülükler:</strong> İlgili yasalara göre
                belirlenen süreler
              </li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Veri Güvenliği
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Verilerinizin güvenliği bizim için önceliklidir. Endüstri standardı
              şifreleme, güvenlik duvarları ve erişim kontrolleri kullanıyoruz.
              Verileriniz güvenli bulut altyapısı üzerinde saklanmaktadır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Veri Paylaşımı
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Verileriniz aşağıdaki durumlar dışında üçüncü taraflarla
              paylaşılmaz:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Hizmet Sağlayıcılar:</strong> Hizmetlerimizi sağlamak
                için gerekli teknik altyapı sağlayıcıları (veri depolama, hosting
                vb.)
              </li>
              <li>
                <strong>Yasal Zorunluluklar:</strong> Yasalara uyum için gerekli
                durumlarda yetkili makamlara
              </li>
              <li>
                <strong>İzin:</strong> Açık izniniz olması durumunda
              </li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              8. Veri Aktarımı
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Verileriniz, hizmet sağlayıcılarımız aracılığıyla AB dışına
              aktarılabilir. Bu durumda, yeterli koruma önlemleri alınır ve
              standart sözleşme maddeleri uygulanır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              9. Kullanıcı Hakları (GDPR)
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              GDPR kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>
                <strong>Erişim Hakkı:</strong> Kişisel verilerinize erişim
                talep edebilirsiniz
              </li>
              <li>
                <strong>Düzeltme Hakkı:</strong> Yanlış veya eksik verilerinizi
                düzeltebilirsiniz
              </li>
              <li>
                <strong>Silme Hakkı:</strong> Verilerinizin silinmesini talep
                edebilirsiniz (&quot;Unutulma Hakkı&quot;)
              </li>
              <li>
                <strong>İtiraz Hakkı:</strong> Veri işlemeye itiraz edebilirsiniz
              </li>
              <li>
                <strong>Kısıtlama Hakkı:</strong> Veri işlemenin kısıtlanmasını
                talep edebilirsiniz
              </li>
              <li>
                <strong>Taşınabilirlik Hakkı:</strong> Verilerinizi başka bir
                hizmete aktarabilirsiniz
              </li>
              <li>
                <strong>Rıza Geri Çekme:</strong> Verdiğiniz rızayı geri
                çekebilirsiniz
              </li>
            </ul>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              10. Çocukların Gizliliği
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, 13 yaşın altındaki çocuklardan bilerek veri toplamaz. 13
              yaşın altındaki bir çocuğun verilerini topladığımızı fark edersek,
              bu verileri derhal sileriz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              11. Politika Değişiklikleri
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli
              değişiklikler kullanıcılara bildirilecektir. Güncel politika
              her zaman bu sayfada yayınlanmaktadır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              12. İletişim
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Gizlilik politikamız, veri haklarınız veya veri işleme
              faaliyetlerimiz hakkında sorularınız için bizimle iletişime
              geçebilirsiniz. İletişim bilgileri için{" "}
              <a
                href="/contact"
                className="text-blue-600 underline dark:text-blue-400"
              >
                İletişim
              </a>{" "}
              sayfasını ziyaret edebilirsiniz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              13. Şikayet Hakkı
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Veri işleme faaliyetlerimiz hakkında şikayetiniz varsa, önce
              bizimle iletişime geçmenizi öneririz. Ayrıca, ilgili veri koruma
              otoritesine de şikayet başvurusu yapabilirsiniz.
            </p>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

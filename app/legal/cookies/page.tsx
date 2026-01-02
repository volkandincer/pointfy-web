import { Cookie } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Çerez Politikası | TeamHubX",
  description: "TeamHubX çerez politikası: hangi çerezleri neden kullanıyoruz.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-md border-2 border-primary bg-primary/10">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-card-foreground sm:text-4xl">
              Çerez Politikası
            </h1>
            <p className="text-sm text-muted-foreground">
              Hangi çerezleri kullandığımızı ve bunları nasıl yönetebileceğinizi öğrenin.
            </p>
          </div>

          {/* Content Card */}
          <div className="rounded-md border-2 border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="prose prose-gray max-w-none dark:prose-invert">
            <p className="mb-4 text-muted-foreground">
              <strong>Son Güncelleme:</strong> {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="mb-4 text-muted-foreground">
              TeamHubX web sitesi, hizmetlerimizi iyileştirmek ve size daha iyi
              bir deneyim sunmak için çerezler kullanmaktadır. Bu politika,
              hangi çerezleri kullandığımızı ve bunları nasıl yönetebileceğinizi
              açıklamaktadır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-card-foreground">
              1. Çerez Nedir?
            </h2>
            <p className="mb-4 text-muted-foreground">
              Çerezler, web sitelerinin tarayıcınıza kaydettiği küçük metin
              dosyalarıdır. Bu dosyalar, sitenin daha sonraki ziyaretlerinizde
              sizi tanımasını, tercihlerinizi hatırlamasını ve site deneyiminizi
              iyileştirmesini sağlar.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-card-foreground">
              2. Kullandığımız Çerez Türleri
            </h2>
            <p className="mb-4 text-muted-foreground">
              TeamHubX, aşağıdaki türde çerezler kullanmaktadır:
            </p>

            <h3 className="mt-6 text-xl font-semibold text-card-foreground">
              2.1. Gerekli Çerezler
            </h3>
            <p className="mb-4 text-muted-foreground">
              Bu çerezler, sitenin temel işlevleri için zorunludur ve sitenin
              çalışması için gereklidir. Bu çerezler olmadan sitenin bazı
              özellikleri çalışmayabilir.
            </p>
            <ul className="mb-4 ml-6 list-disc text-muted-foreground">
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

            <h3 className="mt-6 text-xl font-semibold text-card-foreground">
              2.2. İşlevsellik Çerezleri
            </h3>
            <p className="mb-4 text-muted-foreground">
              Bu çerezler, tercihlerinizi hatırlamak ve size kişiselleştirilmiş
              bir deneyim sunmak için kullanılır.
            </p>
            <ul className="mb-4 ml-6 list-disc text-muted-foreground">
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

            <h3 className="mt-6 text-xl font-semibold text-card-foreground">
              2.3. Analitik Çerezler
            </h3>
            <p className="mb-4 text-muted-foreground">
              Bu çerezler, site kullanımını anlamak ve hizmetlerimizi
              iyileştirmek için kullanılır. Bu çerezler anonim veri toplar ve
              kişisel bilgi içermez.
            </p>
            <ul className="mb-4 ml-6 list-disc text-muted-foreground">
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

            <h2 className="mt-8 text-2xl font-semibold text-card-foreground">
              3. Çerez Saklama Süreleri
            </h2>
            <p className="mb-4 text-muted-foreground">
              Çerezler, saklama sürelerine göre iki kategoriye ayrılır:
            </p>
            <ul className="mb-4 ml-6 list-disc text-muted-foreground">
              <li>
                <strong>Oturum Çerezleri:</strong> Tarayıcınızı kapattığınızda
                otomatik olarak silinir
              </li>
              <li>
                <strong>Kalıcı Çerezler:</strong> Belirli bir süre boyunca
                (genellikle 12 ay) tarayıcınızda kalır
              </li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-card-foreground">
              4. Üçüncü Taraf Çerezler
            </h2>
            <p className="mb-4 text-muted-foreground">
              Hizmetlerimiz, üçüncü taraf hizmet sağlayıcıların çerezlerini
              içerebilir. Bu çerezler, ilgili hizmet sağlayıcının gizlilik
              politikasına tabidir. Daha fazla bilgi için{" "}
              <a
                href="/legal/third-party"
                className="text-primary underline"
              >
                Üçüncü Taraf Hizmetler
              </a>{" "}
              sayfasını ziyaret edebilirsiniz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-card-foreground">
              5. Çerez Yönetimi
            </h2>
            <p className="mb-4 text-muted-foreground">
              Tarayıcı ayarlarınızdan çerezleri yönetebilir veya
              engelleyebilirsiniz. Ancak bazı çerezleri devre dışı bırakmak,
              sitenin bazı özelliklerinin çalışmamasına neden olabilir.
            </p>
            <p className="mb-4 text-muted-foreground">
              Popüler tarayıcılarda çerez ayarlarına nasıl erişeceğiniz:
            </p>
            <ul className="mb-4 ml-6 list-disc text-muted-foreground">
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

            <h2 className="mt-8 text-2xl font-semibold text-card-foreground">
              6. Çerez Onayı
            </h2>
            <p className="mb-4 text-muted-foreground">
              Gerekli çerezler dışındaki çerezler için onayınızı alırız. İlk
              ziyaretinizde veya çerez tercihlerinizi değiştirdiğinizde çerez
              onay ekranı görüntülenir.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-card-foreground">
              7. Çerez Politikası Değişiklikleri
            </h2>
            <p className="mb-4 text-muted-foreground">
              Bu çerez politikasını zaman zaman güncelleyebiliriz. Önemli
              değişiklikler kullanıcılara bildirilecektir. Güncel politika
              her zaman bu sayfada yayınlanmaktadır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-card-foreground">
              8. İletişim
            </h2>
            <p className="mb-4 text-muted-foreground">
              Çerez politikamız hakkında sorularınız için bizimle iletişime
              geçebilirsiniz. İletişim bilgileri için{" "}
              <a
                href="/contact"
                className="text-primary underline"
              >
                İletişim
              </a>{" "}
              sayfasını ziyaret edebilirsiniz.
            </p>
            </div>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

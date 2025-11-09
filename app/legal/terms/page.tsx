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
              <strong>Son Güncelleme:</strong> {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy uygulamasını kullanarak aşağıdaki kullanım şartlarını
              kabul etmiş sayılırsınız. Lütfen bu şartları dikkatlice okuyun.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Hizmetin Kapsamı
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, takım işbirliği için poker planning, retrospektif
              toplantıları ve görev yönetimi araçları sunan bir platformdur.
              Hizmetlerimiz web uygulaması ve mobil uygulama üzerinden
              sağlanmaktadır.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Hesap Oluşturma ve Güvenlik
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Hizmetlerimizi kullanmak için bir hesap oluşturmanız gerekebilir.
              Hesap bilgilerinizin doğruluğundan ve güncelliğinden siz
              sorumlusunuz. Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi
              güvende tutun ve başkalarıyla paylaşmayın. Hesabınız altında
              yapılan tüm işlemlerden sorumlusunuz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Kullanım Koşulları
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy uygulamasını yalnızca yasal ve meşru amaçlar için
              kullanabilirsiniz. Aşağıdaki faaliyetler kesinlikle yasaktır:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
              <li>Uygulamayı kötüye kullanmak veya zarar vermek</li>
              <li>Zararlı, tehdit edici, hakaret içeren veya yasadışı içerik paylaşmak</li>
              <li>Başkalarının haklarını ihlal etmek (telif hakkı, marka hakkı vb.)</li>
              <li>Spam, phishing veya dolandırıcılık faaliyetlerinde bulunmak</li>
              <li>Hizmetlerimizin güvenliğini veya bütünlüğünü tehdit etmek</li>
              <li>Otomatik sistemler veya botlar kullanarak hizmetleri kötüye kullanmak</li>
              <li>Diğer kullanıcıların verilerine yetkisiz erişim sağlamak</li>
            </ul>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Kullanıcı İçeriği
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Uygulama içinde oluşturduğunuz içeriklerden (odalar, görevler,
              notlar vb.) siz sorumlusunuz. İçeriklerinizin yasalara uygun
              olduğundan ve başkalarının haklarını ihlal etmediğinden emin
              olmalısınız. Pointfy, kullanıcı içeriklerini kontrol etme veya
              onaylama yükümlülüğü taşımaz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Fikri Mülkiyet Hakları
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy platformu, yazılımı, tasarımı ve markaları Pointfy&apos;a
              aittir ve telif hakkı, marka hakkı ve diğer fikri mülkiyet
              yasaları ile korunmaktadır. Hizmetlerimizi kullanmanız size
              herhangi bir fikri mülkiyet hakkı vermez.
            </p>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Kullanıcı içerikleriniz size aittir. Ancak, içeriklerinizi
              platformumuzda paylaşarak, bu içerikleri hizmetlerimizi sağlamak
              için kullanma lisansı vermiş olursunuz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Hizmet Kesintileri ve Değişiklikler
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, bakım, güncelleme, teknik sorunlar veya beklenmeyen
              durumlar nedeniyle hizmet kesintileri yaşayabilir. Bu durumlardan
              sorumlu tutulamayız. Hizmetlerimizi önceden haber vermeksizin
              değiştirme, askıya alma veya sonlandırma hakkını saklı tutarız.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Sorumluluk Reddi
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Pointfy, hizmetlerin &quot;olduğu gibi&quot; ve &quot;müsait
              olduğu şekilde&quot; sağlandığını beyan eder. Hizmetlerimizin
              kesintisiz, hatasız veya güvenli olacağını garanti etmeyiz.
              Hizmetlerimizin kullanımından kaynaklanan doğrudan, dolaylı,
              özel, arızi veya sonuç zararlarından sorumlu değiliz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              8. Garanti Reddi
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Hizmetlerimiz, açık veya zımni hiçbir garanti olmaksızın
              sağlanmaktadır. Ticari kullanılabilirlik, belirli bir amaca
              uygunluk ve ihlal edilmemesi garantileri dahil olmak üzere,
              ancak bunlarla sınırlı olmamak üzere, tüm garantiler reddedilir.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              9. Tazminat
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Hizmetlerimizi kullanımınızdan, kullanım şartlarını ihlal
              etmenizden veya başkalarının haklarını ihlal etmenizden
              kaynaklanan tüm zarar, kayıp, sorumluluk ve masraflardan (avukat
              ücretleri dahil) bizi zararsız tutmayı kabul edersiniz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              10. Hesap Sonlandırma
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Kullanım şartlarını ihlal etmeniz durumunda, hesabınızı önceden
              haber vermeksizin askıya alabilir veya sonlandırabiliriz. Hesabınızı
              istediğiniz zaman kapatabilirsiniz. Hesap kapatıldığında, içerikleriniz
              silinebilir ve geri alınamaz.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              11. Üçüncü Taraf Hizmetler
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Hizmetlerimiz üçüncü taraf hizmetler ve bağlantılar içerebilir.
              Bu hizmetlerin içeriği, gizlilik politikaları veya uygulamalarından
              sorumlu değiliz. Üçüncü taraf hizmetlerin kullanımı kendi riskinizdedir.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              12. Değişiklikler
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu kullanım şartlarını istediğimiz zaman güncelleyebiliriz. Önemli
              değişiklikler kullanıcılara bildirilecektir. Güncel şartlar her zaman
              bu sayfada yayınlanmaktadır. Değişikliklerden sonra hizmetleri
              kullanmaya devam etmeniz, güncellenmiş şartları kabul ettiğiniz
              anlamına gelir.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              13. Uygulanacak Hukuk ve Uyuşmazlık Çözümü
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu kullanım şartları Türkiye Cumhuriyeti yasalarına tabidir.
              Bu şartlardan kaynaklanan uyuşmazlıklar öncelikle dostane görüşmeler
              ile çözülmeye çalışılacaktır. Çözülemezse, Türkiye Cumhuriyeti
              mahkemeleri yetkilidir.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              14. Bölünebilirlik
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Bu şartların herhangi bir hükmünün geçersiz veya uygulanamaz
              olması, diğer hükümlerin geçerliliğini etkilemez. Geçersiz hüküm,
              mümkün olduğunca geçerli bir hükümle değiştirilecektir.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white">
              15. İletişim
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Kullanım şartları hakkında sorularınız için bizimle iletişime
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

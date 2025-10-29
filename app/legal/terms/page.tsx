import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

const navigationItems: NavigationItem[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Özellikler", href: "/#features" },
  { label: "İndir", href: "/#download" },
];

export default function TermsPage() {
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

"use client";

import {
  Users,
  Target,
  RefreshCw,
  CheckSquare,
  Link2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MarketingPageHero from "@/components/layout/MarketingPageHero";
import Button from "@/components/ui/Button";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Users,
    title: "Takım Odaları",
    description:
      "Her proje veya sprint için ayrı bir oda oluşturun. Katılımcılarınızı davet edin, oturumu birlikte yönetin.",
  },
  {
    icon: Target,
    title: "Poker Planning",
    description:
      "Görevleri kartlarla oylayın, tahminlerinizi anında karşılaştırın ve ekip olarak ortak bir sonuca varın.",
  },
  {
    icon: RefreshCw,
    title: "Retrospektif",
    description:
      "İyi giden, kötü giden ve aksiyon maddelerini toplayın; sprint sonunda gerçek iyileştirmelere dönüştürün.",
  },
  {
    icon: CheckSquare,
    title: "Görev ve Not Yönetimi",
    description:
      "Kişisel task'larınızı board'larda organize edin, notlarınızı tutun, takımınızla paylaşın.",
  },
  {
    icon: Link2,
    title: "Jira Entegrasyonu",
    description:
      "Jira hesabınızı OAuth ile bağlayın; projelerinizi, issue'larınızı ve story point'lerinizi TeamHubX'ten yönetin.",
  },
  {
    icon: Zap,
    title: "Gerçek Zamanlı Senkronizasyon",
    description:
      "Oy verme, kart ekleme ve durum değişiklikleri anında herkese yansır — sayfa yenilemeye gerek yok.",
  },
];

export default function FeaturesPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main>
        <MarketingPageHero
          eyebrow="Özellikler"
          title="Takımınızı yönetmek için ihtiyacınız olan her şey"
          description="Planlama toplantılarından retrospektife, Jira senkronizasyonundan kişisel görev takibine kadar tek platformda."
        />

        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-card-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-xl border border-primary/30 bg-primary/5 p-6 text-center sm:p-8">
            <h2 className="text-lg font-semibold text-foreground">
              Hepsini birlikte deneyin
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Erken erişim döneminde tüm özellikler ücretsiz.
            </p>
            <div className="mt-5">
              <Button variant="primary" size="md" href="/login?tab=register" showArrow>
                Ücretsiz Başlayın
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

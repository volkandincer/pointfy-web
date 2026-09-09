"use client";

import { Check } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MarketingPageHero from "@/components/layout/MarketingPageHero";
import Button from "@/components/ui/Button";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

const included = [
  "Sınırsız takım odası",
  "Poker planning ve retrospektif",
  "Kişisel görev ve not yönetimi",
  "Jira entegrasyonu",
  "Gerçek zamanlı senkronizasyon",
  "Sınırsız takım üyesi",
];

export default function PricingPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main>
        <MarketingPageHero
          eyebrow="Fiyatlandırma"
          title="Basit ve şeffaf"
          description="Erken erişim sürecinde tek bir plan sunuyoruz: tamamen ücretsiz. Yakında farklı planlar ve kurumsal seçenekler eklenecek."
        />

        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-md rounded-2xl border-2 border-primary bg-card p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">
                Erken Erişim
              </h2>
              <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Beta
              </span>
            </div>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-card-foreground">
                Ücretsiz
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Beta süresince, kredi kartı gerekmez.
            </p>

            <ul className="mt-6 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-card-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="primary"
              size="lg"
              href="/login?tab=register"
              fullWidth
              className="mt-8"
            >
              Ücretsiz Başlayın
            </Button>
          </div>

          <p className="mx-auto mt-8 max-w-md text-center text-sm text-muted-foreground">
            Kurumsal ihtiyaçlarınız mı var?{" "}
            <a href="/contact" className="font-medium text-primary hover:underline">
              Bizimle iletişime geçin
            </a>
            .
          </p>
        </section>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

"use client";

import Link from "next/link";
import { Users, Target, RefreshCw, Zap } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MarketingPageHero from "@/components/layout/MarketingPageHero";
import Button from "@/components/ui/Button";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

const principles = [
  {
    icon: Users,
    title: "Ekip önce gelir",
    text: "Araç ekibe uysun diye tasarlandı; ekip araca uymak zorunda kalmasın istedik.",
  },
  {
    icon: Target,
    title: "Dağınıklığı azalt",
    text: "Planlama, retro ve görev takibi için ayrı ayrı araç yerine tek bir yer.",
  },
  {
    icon: RefreshCw,
    title: "Gerçek zamanlı",
    text: "Herkes aynı anda aynı ekranı görür; toplantı sonrası senkronizasyon derdi yok.",
  },
  {
    icon: Zap,
    title: "Mevcut akışa uyum",
    text: "Jira'yı zaten kullanıyorsanız, bağlayın ve issue'larınızla kaldığınız yerden devam edin.",
  },
];

export default function AboutPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main>
        <MarketingPageHero
          eyebrow="Hakkında"
          title="Takım işbirliği için tek bir yer"
          description="TeamHubX, ekiplerin planlama, geri bildirim ve görev yönetimi süreçlerini tek bir platformda toplamasına yardımcı olan modern bir takım işbirliği aracıdır."
        />

        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-base leading-relaxed text-muted-foreground">
              Poker planning için bir sekme, retrospektif için ayrı bir araç,
              görevler için bir üçüncüsü, Jira için tarayıcıda bir sekme daha
              &mdash; çoğu takım toplantı öncesinde bu araçları bir araya
              getirmeye çalışırken vakit kaybediyor. TeamHubX bu süreçleri tek
              bir odada birleştirir: aynı oda içinde oy verin, retrospektif
              yapın, görev oluşturun ve Jira issue&apos;larınızı görüntüleyin.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
            {principles.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-card-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-3xl rounded-xl border border-border bg-muted/40 p-6 text-center sm:p-8">
            <p className="text-sm text-muted-foreground">
              Şu an beta aşamasındayız ve doğrudan kullanıcı geri
              bildirimleriyle şekilleniyoruz.
            </p>
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="primary" size="md" href="/login?tab=register">
                Ücretsiz Deneyin
              </Button>
              <Link
                href="/contact"
                className="text-sm font-medium text-primary hover:underline"
              >
                Bize yazın &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

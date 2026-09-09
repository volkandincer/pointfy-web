"use client";

import { memo } from "react";
import { Users, Target, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

const Hero = memo(function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Ambient background accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
      >
        <div className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-primary/25 via-primary/10 to-transparent opacity-70" />
      </div>

      <div className="container mx-auto px-4 pt-16 pb-14 sm:pt-24 sm:pb-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Erken erişim &mdash; şu an ücretsiz
          </div>

          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Takımınızın planlama, retro ve
            <br className="hidden sm:block" />{" "}
            <span className="text-primary">görev yönetimi</span> merkezi
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            Poker planning, retrospektif ve görev takibini tek platformda toplayın.
            Jira&apos;yı bağlayın, ekibinizle gerçek zamanlı çalışın.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              href="/login?tab=register"
              showArrow
              className="w-full sm:w-auto"
            >
              Ücretsiz Başlayın
            </Button>
            <Button
              variant="secondary"
              size="lg"
              href="/features"
              className="w-full sm:w-auto"
            >
              Özellikleri İncele
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Kredi kartı gerekmez &middot; Kayıt 30 saniye sürer
          </p>
        </div>

        {/* Lightweight capability strip */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Takım Odaları",
              text: "Ekibinizi organize edin",
            },
            {
              icon: Target,
              title: "Poker Planning",
              text: "Birlikte tahmin yapın",
            },
            {
              icon: RefreshCw,
              title: "Retrospektif",
              text: "Sürekli iyileştirin",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-3 bg-card px-5 py-4 text-left"
            >
              <Icon className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Hero;

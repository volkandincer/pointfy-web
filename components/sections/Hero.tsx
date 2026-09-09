"use client";

import { memo } from "react";
import { Check, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

const VOTE_CARDS = [
  { value: "5", rotate: -12, offset: -52, tone: "ink" as const, z: 0 },
  { value: "8", rotate: 0, offset: 0, tone: "primary" as const, z: 2 },
  { value: "13", rotate: 12, offset: 52, tone: "amber" as const, z: 1 },
];

const cardTone: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  ink: "bg-foreground text-background",
  amber: "bg-amber-400 text-amber-950",
};

const Hero = memo(function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Dot-grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          color: "var(--border)",
        }}
      />
      {/* Ambient color wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 flex justify-center blur-3xl"
      >
        <div className="aspect-[1200/700] w-[76rem] bg-gradient-to-tr from-primary/20 via-amber-400/10 to-transparent" />
      </div>

      <div className="container mx-auto px-4 pt-16 pb-16 sm:pt-20 md:pt-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Erken erişim &mdash; şu an ücretsiz
            </div>

            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[3.4rem]">
              Ekibiniz nasıl<br />
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">planlar, oylar</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-amber-300/60 sm:h-4"
                />
              </span>
              , iyileşir?
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-balance text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Poker planning, retrospektif ve görev takibini tek platformda
              toplayın. Jira&apos;yı bağlayın, ekibinizle gerçek zamanlı
              çalışın.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
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

          {/* Illustrated planning-poker scene */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-40 w-64">
                {VOTE_CARDS.map((card) => (
                  <div
                    key={card.value}
                    style={{
                      transform: `translateX(${card.offset}px) rotate(${card.rotate}deg)`,
                      zIndex: card.z,
                    }}
                    className={`absolute left-1/2 top-1/2 flex h-36 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-between rounded-xl border border-black/10 p-3 shadow-xl ${cardTone[card.tone]}`}
                  >
                    <span className="self-start text-sm font-bold">
                      {card.value}
                    </span>
                    <span className="text-3xl font-bold">{card.value}</span>
                    <span className="self-end text-sm font-bold rotate-180">
                      {card.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating presence chip */}
            <div className="absolute left-2 top-6 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-md">
              <span className="flex -space-x-2">
                {["EA", "MK", "SD"].map((initials) => (
                  <span
                    key={initials}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-[9px] font-semibold text-primary-foreground"
                  >
                    {initials}
                  </span>
                ))}
              </span>
              <span className="text-xs font-medium text-foreground">
                3 kişi odada
              </span>
            </div>

            {/* Floating vote-result chip */}
            <div className="absolute bottom-8 right-0 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-md">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-foreground">
                Oylar açıklandı
              </span>
            </div>

            {/* Floating retro chip */}
            <div className="absolute right-4 top-0 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-md">
              <RefreshCw className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Retro #12</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Hero;

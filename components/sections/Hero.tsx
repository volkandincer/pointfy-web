"use client";

import { memo } from "react";
import { Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";

const Hero = memo(function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gray-50 dark:bg-gray-950" />

      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-md border-2 border-blue-600 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-500 dark:bg-gray-900 dark:text-blue-400">
            <span className="inline-block h-2 w-2 border-2 border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500" /> Realtime Destekli
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl">
            Takım İşbirliği için
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              Güçlü Bir Platform
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400 md:text-xl">
            Poker planning, retrospektif ve görev yönetimi ile tek yerde. Gerçek zamanlı işbirliği sayesinde daha hızlı kararlar alın.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              disabled
              icon={Smartphone}
              className="disabled:opacity-60 disabled:cursor-not-allowed"
            >
              App Store&apos;dan İndir - Yakında
            </Button>
            <Button
              variant="secondary"
              size="lg"
              disabled
              icon={Smartphone}
              className="disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Google Play&apos;den İndir - Yakında
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Hero;

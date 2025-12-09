"use client";

import { memo } from "react";
import { Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";

const Hero = memo(function Hero() {
  return (
    <section className="relative">
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
            Takım İşbirliği için
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              Güçlü Bir Platform
            </span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Poker planning, retrospektif ve görev yönetimi ile tek yerde. Gerçek
            zamanlı işbirliği sayesinde daha hızlı kararlar alın.
          </p>
          <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button
              variant="primary"
              size="sm"
              disabled
              icon={Smartphone}
              className="disabled:opacity-60 disabled:cursor-not-allowed"
            >
              App Store&apos;dan İndir - Yakında
            </Button>
            <Button
              variant="secondary"
              size="sm"
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

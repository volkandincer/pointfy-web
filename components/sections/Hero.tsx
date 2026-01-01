"use client";

import { memo } from "react";
import { Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";

const Hero = memo(function Hero() {
  return (
    <section className="relative bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            Takımlarınızı Organize Edin,
            <br />
            <span className="text-primary">Daha Verimli Çalışın</span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Poker planning ve retrospektif toplantılarınızı yönetin, görevlerinizi organize edin, 
            Jira ile senkronize çalışın. Takımınızla gerçek zamanlı işbirliği yaparak projelerinizi 
            tek bir platformda yönetin.
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

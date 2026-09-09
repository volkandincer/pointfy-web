"use client";

import { memo } from "react";
import Button from "@/components/ui/Button";

const CTA = memo(function CTA() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-primary px-8 py-14 text-center shadow-sm md:px-16 md:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
        />
        <div className="relative">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
            Ekibinizle bugün başlayın
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-balance text-primary-foreground/85">
            Erken erişim döneminde tamamen ücretsiz. Kredi kartı gerekmez, 30
            saniyede kayıt olun.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="secondary"
              size="lg"
              href="/login?tab=register"
              className="w-full !border-transparent !bg-background !text-foreground hover:!bg-background/90 sm:w-auto"
            >
              Ücretsiz Başlayın
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="/pricing"
              className="w-full !border-primary-foreground/40 !bg-transparent !text-primary-foreground hover:!border-primary-foreground hover:!bg-primary-foreground/10 sm:w-auto"
            >
              Fiyatlandırmayı Gör
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default CTA;

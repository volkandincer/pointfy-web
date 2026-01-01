"use client";

import { memo } from "react";
import { Download, Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";

const CTA = memo(function CTA() {
  return (
    <section id="download" className="container mx-auto px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl rounded-md border-2 border-border bg-card p-6 text-center shadow-sm sm:p-8 md:p-10">
        <div className="mb-4 flex justify-center sm:mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-primary bg-primary/10 sm:h-14 sm:w-14">
            <Download className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
          </div>
        </div>
        <h2 className="mb-2 text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
          Hemen Başlayın
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-xs text-muted-foreground sm:text-sm">
          TeamHubX&apos;ı indirin ve takımınızla daha verimli çalışmaya başlayın.
        </p>
        <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
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
    </section>
  );
});

export default CTA;

"use client";

import { memo } from "react";
import { Download, Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";

const CTA = memo(function CTA() {
  return (
    <section id="download" className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
      {/* Decorative Background Elements */}
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      
      <div className="container relative mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 text-center shadow-xl sm:p-8 md:p-10">
          {/* Glow Effect */}
          <div className="absolute right-0 top-0 h-48 w-48 translate-x-12 -translate-y-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 blur-3xl" />
          
          <div className="relative mb-4 flex justify-center sm:mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 transition-transform hover:scale-110 sm:h-16 sm:w-16">
              <Download className="h-7 w-7 text-primary-foreground sm:h-8 sm:w-8" />
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
              className="shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              App Store&apos;dan İndir - Yakında
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled
              icon={Smartphone}
              className="shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Google Play&apos;den İndir - Yakında
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default CTA;

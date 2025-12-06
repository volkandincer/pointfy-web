"use client";

import { memo } from "react";
import { Download, Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";

const CTA = memo(function CTA() {
  return (
    <section id="download" className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl rounded-md border-2 border-blue-600 bg-blue-600 p-8 text-center text-white shadow-sm md:p-12">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-white/20 bg-white/10">
            <Download className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Hemen Başlayın
        </h2>
        <p className="mb-8 text-base text-blue-50 md:text-lg">
          Pointfy&apos;ı indirin ve takımınızla daha verimli çalışmaya başlayın.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="secondary"
            size="lg"
            disabled
            icon={Smartphone}
            className="bg-white text-blue-600 hover:bg-gray-50 hover:text-blue-700 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white dark:text-blue-600"
          >
            App Store&apos;dan İndir - Yakında
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled
            icon={Smartphone}
            className="border-white text-white hover:bg-white/10 hover:border-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Google Play&apos;den İndir - Yakında
          </Button>
        </div>
      </div>
    </section>
  );
});

export default CTA;

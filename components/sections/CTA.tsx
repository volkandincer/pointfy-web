"use client";

import { memo } from "react";

const CTA = memo(function CTA() {
  return (
    <section id="download" className="container mx-auto px-4 py-12">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center text-white shadow-[0_12px_32px_rgba(59,130,246,0.4)] md:p-10">
        <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
          Hemen Başlayın
        </h2>
        <p className="mb-6 text-sm text-blue-100 md:text-base">
          Pointfy&apos;ı indirin ve takımınızla daha verimli çalışmaya başlayın.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            disabled
            className="flex h-11 cursor-not-allowed items-center justify-center rounded-lg bg-white/60 px-5 text-sm font-semibold text-blue-600/60 shadow-sm"
          >
            App Store&apos;dan İndir - Yakında
          </button>
          <button
            disabled
            className="flex h-11 cursor-not-allowed items-center justify-center rounded-lg border-2 border-white/60 bg-transparent px-5 text-sm font-semibold text-white/60"
          >
            Google Play&apos;den İndir - Yakında
          </button>
        </div>
      </div>
    </section>
  );
});

export default CTA;

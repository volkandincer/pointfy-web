"use client";

import Link from "next/link";
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
          <Link
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            App Store&apos;dan İndir
          </Link>
          <Link
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-lg border-2 border-white bg-transparent px-5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
          >
            Google Play&apos;den İndir
          </Link>
        </div>
      </div>
    </section>
  );
});

export default CTA;

"use client";

import Link from "next/link";
import { memo } from "react";

const CTA = memo(function CTA() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center text-white md:p-12">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">Hemen Başlayın</h2>
        <p className="mb-8 text-lg text-blue-100 md:text-xl">
          Pointfy&apos;ı indirin ve takımınızla daha verimli çalışmaya başlayın.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-lg bg-white px-6 font-semibold text-blue-600 transition-colors hover:bg-gray-100"
          >
            App Store&apos;dan İndir
          </Link>
          <Link
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-lg border-2 border-white bg-transparent px-6 font-semibold text-white transition-colors hover:bg-white/10"
          >
            Google Play&apos;den İndir
          </Link>
        </div>
      </div>
    </section>
  );
});

export default CTA;

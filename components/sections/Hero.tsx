"use client";

import { memo } from "react";

const Hero = memo(function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-950/40 dark:via-gray-950 dark:to-gray-950" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/20" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-500/20" />

      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/70 px-3 py-1 text-xs font-medium text-blue-700 backdrop-blur dark:border-blue-800/60 dark:bg-gray-900/60 dark:text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Realtime Destekli
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl">
            Takım İşbirliği için
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              Güçlü Bir Platform
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400 md:text-xl">
            Poker planning, retrospektif ve görev yönetimi ile tek yerde. Gerçek zamanlı işbirliği sayesinde daha hızlı kararlar alın.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              disabled
              className="flex h-12 cursor-not-allowed items-center justify-center rounded-lg bg-gray-400 px-6 font-semibold text-white shadow-sm dark:bg-gray-700 dark:text-gray-300"
            >
              App Store&apos;dan İndir - Yakında
            </button>
            <button
              disabled
              className="flex h-12 cursor-not-allowed items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-6 font-semibold text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
            >
              Google Play&apos;den İndir - Yakında
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

export default Hero;

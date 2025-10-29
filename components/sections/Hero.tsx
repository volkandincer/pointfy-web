"use client";

import Link from "next/link";
import { memo } from "react";

const Hero = memo(function Hero() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl">
          Takım İşbirliği için
          <br />
          <span className="text-blue-600 dark:text-blue-400">
            Güçlü Bir Platform
          </span>
        </h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400 md:text-xl">
          Poker planning, retrospektif toplantıları ve görev yönetimi ile
          takımınızı bir araya getirin. Gerçek zamanlı işbirliği ile daha
          verimli olun.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-lg bg-gray-900 px-6 font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            App Store&apos;dan İndir
          </Link>
          <Link
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-white px-6 font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            Google Play&apos;den İndir
          </Link>
        </div>
      </div>
    </section>
  );
});

export default Hero;

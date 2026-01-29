"use client";

import { memo } from "react";
import Link from "next/link";

const BetaBanner = memo(function BetaBanner() {
  return (
    <div className="sticky top-0 z-[60] w-full border-b border-yellow-600/30 bg-gradient-to-r from-yellow-50 via-yellow-50/50 to-yellow-50 dark:from-yellow-900/20 dark:via-yellow-900/10 dark:to-yellow-900/20 shadow-sm">
      <div className="container mx-auto flex items-center gap-3 px-4 py-2 md:px-6">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs font-bold text-yellow-900 dark:text-yellow-300">
            BETA
          </span>
          <span className="text-xs text-yellow-800 dark:text-yellow-400">
            Pointfy şu anda beta aşamasındadır.{" "}
            <Link
              href="/contact"
              className="font-semibold underline underline-offset-2 transition-colors hover:text-yellow-900 dark:hover:text-yellow-300"
            >
              Geri bildirimleriniz
            </Link>
            {" "}bizim için çok değerli!
          </span>
        </div>
      </div>
    </div>
  );
});

export default BetaBanner;


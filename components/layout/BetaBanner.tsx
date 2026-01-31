"use client";

import { memo } from "react";
import Link from "next/link";

const BetaBanner = memo(function BetaBanner() {
  return (
    <div className="sticky top-0 z-[60] w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
      <div className="container mx-auto flex items-center gap-3 px-4 py-2 md:px-6">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2 text-center">
          <span className="text-sm font-semibold">BETA</span>
          <span className="text-sm">
            Pointfy ürünün beta aşamasındadır.{" "}
            <Link
              href="/contact"
              className="underline hover:no-underline"
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


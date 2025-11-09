"use client";

import Link from "next/link";
import { memo } from "react";
import type { QuickAction } from "@/interfaces/QuickAction.interface";

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions = memo(function QuickActions({ actions }: QuickActionsProps) {
  // İlk action'ı (Oda Oluştur) featured card olarak ayır
  const featuredAction = actions[0];
  const otherActions = actions.slice(1);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
            Hızlı İşlemler
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 md:text-base">
            Takım çalışmanızı başlatın
          </p>
        </div>

        {/* Featured Card - Oda Oluştur */}
        {featuredAction && (
          <Link
            href={featuredAction.href}
            className="group relative mb-5 block overflow-hidden rounded-3xl border-2 border-blue-400/40 bg-white p-6 shadow-[0_12px_24px_rgba(59,130,246,0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(59,130,246,0.4)] dark:border-blue-500/30 dark:bg-gray-900"
          >
            <div className="mb-4 text-4xl">{featuredAction.icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              {featuredAction.title}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {featuredAction.description}
            </p>
          </Link>
        )}

        {/* Diğer Action'lar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {otherActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="group relative block overflow-hidden rounded-2xl border-2 border-blue-400/15 bg-white p-5 shadow-[0_8px_20px_rgba(59,130,246,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(59,130,246,0.2)] dark:border-blue-500/10 dark:bg-gray-900"
            >
              <div className="mb-3 text-4xl">{action.icon}</div>
              <h3 className="mb-1.5 text-base font-semibold text-gray-900 dark:text-white">
                {action.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

export default QuickActions;



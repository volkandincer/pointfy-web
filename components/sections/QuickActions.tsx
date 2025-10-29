"use client";

import Link from "next/link";
import { memo } from "react";
import type { QuickAction } from "@/interfaces/QuickAction.interface";

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions = memo(function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Hızlı işlemler</h2>
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">Takım çalışmanızı başlatın</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="group relative block overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800/70 dark:bg-gray-900"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-xl dark:from-gray-800 dark:to-gray-700">
                <span>{action.icon}</span>
              </div>
              <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">{action.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

export default QuickActions;



"use client";

import Link from "next/link";
import { memo } from "react";

interface HomeWelcomeProps {
  username?: string;
}

const HomeWelcome = memo(function HomeWelcome({ username }: HomeWelcomeProps) {
  return (
    <section className="container mx-auto px-4 pt-8 pb-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
              Pointfy
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 md:text-base">
              {username
                ? `Hoş geldin, ${username}! 👋`
                : "Takım çalışmanızı başlatın"}
            </p>
          </div>
          <Link
            href="/app/tasks"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200/70 bg-white/80 text-xl backdrop-blur-sm transition hover:scale-110 hover:bg-white dark:border-gray-800/70 dark:bg-gray-900/80 dark:hover:bg-gray-900"
          >
            <span>🧑‍💼</span>
          </Link>
        </div>
      </div>
    </section>
  );
});

export default HomeWelcome;

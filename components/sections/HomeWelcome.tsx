"use client";

import { memo } from "react";

interface HomeWelcomeProps {
  username?: string;
}

const HomeWelcome = memo(function HomeWelcome({ username }: HomeWelcomeProps) {
  return (
    <section className="container mx-auto px-4 pt-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pointfy
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {username
                  ? `Hoş geldin, ${username}!`
                  : "Takım çalışmanızı başlatın"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl dark:bg-gray-800">
              <span>👤</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default HomeWelcome;

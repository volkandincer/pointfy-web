"use client";

import { memo, useMemo } from "react";
import type { Feature } from "@/interfaces/Feature.interface";

interface FeaturesProps {
  features: Feature[];
}

const Features = memo(function Features({ features }: FeaturesProps) {
  const memoizedFeatures = useMemo(() => features, [features]);

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
          Özellikler
        </h2>
        <p className="mb-12 text-center text-gray-600 dark:text-gray-400">
          Pointfy ile takımınızı yönetmek hiç bu kadar kolay olmamıştı
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {memoizedFeatures.map((feature) => (
            <div
              key={feature.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Features;

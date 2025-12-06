"use client";

import { memo, useMemo } from "react";
import { 
  Users, 
  Target, 
  RefreshCw, 
  CheckSquare, 
  Zap, 
  Sparkles,
  type LucideIcon 
} from "lucide-react";
import type { Feature } from "@/interfaces/Feature.interface";

interface FeaturesProps {
  features: Feature[];
}

// Feature icon and color mapping
const featureConfig: Record<string, { icon: LucideIcon; color: string }> = {
  "1": { icon: Users, color: "blue" },
  "2": { icon: Target, color: "green" },
  "3": { icon: RefreshCw, color: "purple" },
  "4": { icon: CheckSquare, color: "orange" },
  "5": { icon: Zap, color: "yellow" },
  "6": { icon: Sparkles, color: "pink" },
};

const colorClasses: Record<string, { border: string; icon: string; iconBorder: string }> = {
  blue: {
    border: "border-l-blue-600 dark:border-l-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
    iconBorder: "border-blue-600 dark:border-blue-500",
  },
  green: {
    border: "border-l-green-600 dark:border-l-green-500",
    icon: "text-green-600 dark:text-green-400",
    iconBorder: "border-green-600 dark:border-green-500",
  },
  purple: {
    border: "border-l-purple-600 dark:border-l-purple-500",
    icon: "text-purple-600 dark:text-purple-400",
    iconBorder: "border-purple-600 dark:border-purple-500",
  },
  orange: {
    border: "border-l-orange-600 dark:border-l-orange-500",
    icon: "text-orange-600 dark:text-orange-400",
    iconBorder: "border-orange-600 dark:border-orange-500",
  },
  yellow: {
    border: "border-l-yellow-600 dark:border-l-yellow-500",
    icon: "text-yellow-600 dark:text-yellow-400",
    iconBorder: "border-yellow-600 dark:border-yellow-500",
  },
  pink: {
    border: "border-l-pink-600 dark:border-l-pink-500",
    icon: "text-pink-600 dark:text-pink-400",
    iconBorder: "border-pink-600 dark:border-pink-500",
  },
};

const Features = memo(function Features({ features }: FeaturesProps) {
  const memoizedFeatures = useMemo(() => features, [features]);

  return (
    <section id="features" className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
            Özellikler
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 md:text-base">
            Pointfy ile takımınızı yönetmek hiç bu kadar kolay olmamıştı
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memoizedFeatures.map((feature) => {
            const config = featureConfig[feature.id] || { icon: CheckSquare, color: "blue" };
            const colors = colorClasses[config.color] || colorClasses.blue;
            const IconComponent = config.icon;

            return (
              <div
                key={feature.id}
                className={`group relative border-l-4 ${colors.border} border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-5 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center border-2 ${colors.iconBorder} bg-white dark:bg-gray-900`}>
                    <IconComponent className={`h-5 w-5 ${colors.icon}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default Features;

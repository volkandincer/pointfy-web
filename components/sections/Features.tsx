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

const colorClasses: Record<string, { 
  iconBg: string; 
  iconText: string; 
  border: string;
  iconBgGradient: string;
}> = {
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconText: "text-blue-600 dark:text-blue-400",
    border: "border-blue-600 dark:border-blue-500",
    iconBgGradient: "from-blue-500 to-blue-600",
  },
  green: {
    iconBg: "bg-green-50 dark:bg-green-900/20",
    iconText: "text-green-600 dark:text-green-400",
    border: "border-green-600 dark:border-green-500",
    iconBgGradient: "from-green-500 to-green-600",
  },
  purple: {
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconText: "text-purple-600 dark:text-purple-400",
    border: "border-purple-600 dark:border-purple-500",
    iconBgGradient: "from-purple-500 to-purple-600",
  },
  orange: {
    iconBg: "bg-orange-50 dark:bg-orange-900/20",
    iconText: "text-orange-600 dark:text-orange-400",
    border: "border-orange-600 dark:border-orange-500",
    iconBgGradient: "from-orange-500 to-orange-600",
  },
  yellow: {
    iconBg: "bg-yellow-50 dark:bg-yellow-900/20",
    iconText: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-600 dark:border-yellow-500",
    iconBgGradient: "from-yellow-500 to-yellow-600",
  },
  pink: {
    iconBg: "bg-pink-50 dark:bg-pink-900/20",
    iconText: "text-pink-600 dark:text-pink-400",
    border: "border-pink-600 dark:border-pink-500",
    iconBgGradient: "from-pink-500 to-pink-600",
  },
};

const Features = memo(function Features({ features }: FeaturesProps) {
  const memoizedFeatures = useMemo(() => features, [features]);

  return (
    <section id="features" className="container mx-auto px-4 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Özellikler
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            TeamHubX ile takımınızı yönetmek hiç bu kadar kolay olmamıştı
          </p>
        </div>
        <div className="space-y-8 md:space-y-16">
          {memoizedFeatures.map((feature, index) => {
            const config = featureConfig[feature.id] || { icon: CheckSquare, color: "blue" };
            const colors = colorClasses[config.color] || colorClasses.blue;
            const IconComponent = config.icon;
            const isEven = index % 2 === 0;

            return (
              <div
                key={feature.id}
                className={`group flex flex-col items-center gap-6 border border-border bg-card p-6 shadow-sm transition-all hover:border-border hover:shadow-md md:flex-row md:gap-8 md:p-8 ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Icon Section */}
                <div className="flex shrink-0 items-center justify-center md:w-1/3">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-md border-2 ${colors.border} bg-gradient-to-br ${colors.iconBgGradient} shadow-md transition-transform group-hover:scale-105 md:h-28 md:w-28`}
                  >
                    <IconComponent className={`h-10 w-10 text-white md:h-14 md:w-14`} />
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col justify-center text-center md:text-left">
                  <h3 className="mb-3 text-xl font-bold text-foreground md:text-2xl lg:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground md:text-base lg:text-lg">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default Features;

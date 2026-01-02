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
import Slider from "@/components/ui/Slider";
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

const colorClasses: Record<string, { border: string; icon: string }> = {
  blue: {
    border: "border-l-blue-600 dark:border-l-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    border: "border-l-green-600 dark:border-l-green-500",
    icon: "text-green-600 dark:text-green-400",
  },
  purple: {
    border: "border-l-purple-600 dark:border-l-purple-500",
    icon: "text-purple-600 dark:text-purple-400",
  },
  orange: {
    border: "border-l-orange-600 dark:border-l-orange-500",
    icon: "text-orange-600 dark:text-orange-400",
  },
  yellow: {
    border: "border-l-yellow-600 dark:border-l-yellow-500",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  pink: {
    border: "border-l-pink-600 dark:border-l-pink-500",
    icon: "text-pink-600 dark:text-pink-400",
  },
};

const Features = memo(function Features({ features }: FeaturesProps) {
  const memoizedFeatures = useMemo(() => features, [features]);

  return (
    <section id="features" className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
            Özellikler
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            TeamHubX ile takımınızı yönetmek hiç bu kadar kolay olmamıştı
          </p>
        </div>
        
        {/* Desktop Grid View */}
        <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          {memoizedFeatures.map((feature) => {
            const config = featureConfig[feature.id] || { icon: CheckSquare, color: "blue" };
            const colors = colorClasses[config.color] || colorClasses.blue;
            const IconComponent = config.icon;

            return (
              <div
                key={feature.id}
                className={`group relative flex min-h-[120px] flex-col items-center justify-center overflow-hidden rounded-lg border-l-4 ${colors.border} border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 text-center shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl`}
              >
                {/* Glow Effect */}
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
                
                {/* Icon */}
                <div className="relative mb-2.5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${colors.icon.replace('text-', 'from-').replace('-600', '-500/20').replace('-400', '-400/20')} to-transparent transition-transform group-hover:scale-110`}>
                    <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${colors.icon}`} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="mb-1 text-sm font-semibold text-card-foreground">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-xs leading-tight text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mobile/Tablet Slider View */}
        <div className="md:hidden">
          <Slider
            autoPlay={true}
            interval={4000}
            showDots={true}
            showArrows={true}
            transition="slide"
          >
            {memoizedFeatures.map((feature) => {
              const config = featureConfig[feature.id] || { icon: CheckSquare, color: "blue" };
              const colors = colorClasses[config.color] || colorClasses.blue;
              const IconComponent = config.icon;

              return (
                <div
                  key={feature.id}
                  className={`group relative flex min-h-[140px] flex-col items-center justify-center overflow-hidden rounded-lg border-l-4 ${colors.border} border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-6 text-center shadow-md transition-all duration-300`}
                >
                  {/* Glow Effect */}
                  <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl" />
                  
                  {/* Icon */}
                  <div className="relative mb-3">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br ${colors.icon.replace('text-', 'from-').replace('-600', '-500/20').replace('-400', '-400/20')} to-transparent`}>
                      <IconComponent className={`h-7 w-7 ${colors.icon}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-base font-semibold text-card-foreground">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </Slider>
        </div>
      </div>
    </section>
  );
});

export default Features;

"use client";

import { memo, useMemo } from "react";
import {
  Users,
  Target,
  RefreshCw,
  CheckSquare,
  Link2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Feature } from "@/interfaces/Feature.interface";

interface FeaturesProps {
  features: Feature[];
}

const iconMap: Record<string, LucideIcon> = {
  "1": Users,
  "2": Target,
  "3": RefreshCw,
  "4": CheckSquare,
  "5": Link2,
  "6": Zap,
};

const Features = memo(function Features({ features }: FeaturesProps) {
  const memoizedFeatures = useMemo(() => features, [features]);

  return (
    <section id="features" className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Özellikler
          </p>
          <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Takımınızı yönetmek için ihtiyacınız olan her şey
          </h2>
          <p className="mt-3 text-balance text-muted-foreground">
            TeamHubX, dağınık araçlar yerine planlama ve işbirliğinizi tek bir
            yerde toplar.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {memoizedFeatures.map((feature) => {
            const IconComponent = iconMap[feature.id] || CheckSquare;
            return (
              <div
                key={feature.id}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <IconComponent className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
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

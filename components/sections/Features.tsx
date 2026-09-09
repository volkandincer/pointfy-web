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

// Two-tone rhythm: indigo (primary) alternating with warm amber — deliberate,
// not a rainbow of unrelated colors per card.
const toneMap: Record<string, { chip: string; icon: string; bar: string }> = {
  "1": { chip: "bg-primary/10", icon: "text-primary", bar: "bg-primary" },
  "2": { chip: "bg-amber-400/15", icon: "text-amber-600 dark:text-amber-400", bar: "bg-amber-400" },
  "3": { chip: "bg-primary/10", icon: "text-primary", bar: "bg-primary" },
  "4": { chip: "bg-amber-400/15", icon: "text-amber-600 dark:text-amber-400", bar: "bg-amber-400" },
  "5": { chip: "bg-primary/10", icon: "text-primary", bar: "bg-primary" },
  "6": { chip: "bg-amber-400/15", icon: "text-amber-600 dark:text-amber-400", bar: "bg-amber-400" },
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

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {memoizedFeatures.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
});

function FeatureCard({ feature }: { feature: Feature }) {
  const IconComponent = iconMap[feature.id] || CheckSquare;
  const tone = toneMap[feature.id] || toneMap["1"];

  return (
    <div className="group relative rounded-xl border border-border bg-card p-6 pt-7 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 rounded-t-xl ${tone.bar}`}
      />
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${tone.chip} ${tone.icon}`}
      >
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
}

export default Features;

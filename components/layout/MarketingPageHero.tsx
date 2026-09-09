"use client";

import { memo } from "react";

interface MarketingPageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
}

const MarketingPageHero = memo(function MarketingPageHero({
  eyebrow,
  title,
  description,
}: MarketingPageHeroProps) {
  return (
    <div className="border-b border-border bg-muted/30">
      <div className="container mx-auto px-4 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {eyebrow}
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export default MarketingPageHero;

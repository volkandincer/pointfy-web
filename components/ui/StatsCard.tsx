"use client";

import { memo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import IconBadge from "@/components/ui/IconBadge";
import { getGlowEffectClasses, getCardBorderColor, type CardBorderColor } from "@/lib/design-utils";
import type { LucideIcon } from "lucide-react";

export interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: CardBorderColor;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const StatsCard = memo(function StatsCard({
  icon,
  value,
  label,
  color = "primary",
  href,
  onClick,
  className = "",
}: StatsCardProps) {
  const glowClasses = getGlowEffectClasses(color);
  const borderColorClass = getCardBorderColor(color);
  
  const baseClasses = [
    "group",
    "relative",
    "overflow-hidden",
    "rounded-lg",
    "border-l-4",
    borderColorClass,
    "border-t-2",
    "border-r-2",
    "border-b-2",
    "border-border",
    "bg-gradient-to-br",
    "from-card",
    "via-card",
    "to-card/50",
    "p-4",
    "shadow-md",
    "transition-all",
    "duration-300",
    "hover:scale-[1.02]",
    "hover:border-border",
    "hover:shadow-xl",
    "sm:p-5",
    className,
  ].join(" ");

  const content = (
    <>
      {/* Glow Effect */}
      <div className={glowClasses} />
      
      {/* Content */}
      <div className="relative mb-4 flex items-center gap-3">
        <IconBadge icon={icon} color={color} size="md" />
        {href && (
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
        )}
      </div>
      
      {/* Stats */}
      <div className="relative">
        <div className="text-2xl font-bold text-card-foreground sm:text-3xl">
          {value}
        </div>
        <div className="mt-1 text-sm font-medium text-muted-foreground">
          {label}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={baseClasses} type="button">
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
});

StatsCard.displayName = "StatsCard";

export default StatsCard;


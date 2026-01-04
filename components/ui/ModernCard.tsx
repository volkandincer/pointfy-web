"use client";

import { memo, type ReactNode } from "react";
import Link from "next/link";
import { getCardClasses, getGlowEffectClasses, type CardBorderColor } from "@/lib/design-utils";

export interface ModernCardProps {
  borderColor?: CardBorderColor;
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  minHeight?: "sm" | "md" | "lg";
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const ModernCard = memo(function ModernCard({
  borderColor = "primary",
  children,
  href,
  onClick,
  className = "",
  minHeight = "md",
  padding = "md",
  interactive = true,
}: ModernCardProps) {
  const cardClasses = getCardClasses({
    borderColor,
    minHeight,
    padding,
    interactive,
  });
  
  const glowClasses = getGlowEffectClasses(borderColor);
  
  const combinedClasses = `${cardClasses} ${className}`.trim();

  const content = (
    <>
      {/* Glow Effect */}
      <div className={glowClasses} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        {children}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={combinedClasses} type="button">
        {content}
      </button>
    );
  }

  return <div className={combinedClasses}>{content}</div>;
});

ModernCard.displayName = "ModernCard";

export default ModernCard;


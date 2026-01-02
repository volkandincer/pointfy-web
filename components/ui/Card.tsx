"use client";

import { memo, ReactNode } from "react";
import { getCardClasses, getGlowEffectClasses, type CardBorderColor } from "@/lib/design-utils";

export interface CardProps {
  children: ReactNode;
  borderColor?: CardBorderColor;
  minHeight?: "sm" | "md" | "lg";
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  glowEffect?: boolean;
  glowColor?: CardBorderColor;
  as?: "div" | "button" | "a";
  href?: string;
}

const Card = memo(function Card({
  children,
  borderColor = "primary",
  minHeight = "md",
  padding = "md",
  interactive = true,
  onClick,
  className = "",
  glowEffect = true,
  glowColor,
  as = "div",
  href,
}: CardProps) {
  const cardClasses = getCardClasses({
    borderColor,
    minHeight,
    padding,
    interactive: interactive && !!(onClick || href),
  });
  
  const glowClasses = glowEffect ? getGlowEffectClasses(glowColor || borderColor) : "";
  
  const combinedClasses = `${cardClasses} ${className}`.trim();
  
  // Render glow effect
  const glowElement = glowEffect ? (
    <div className={glowClasses} aria-hidden="true" />
  ) : null;
  
  // Render based on 'as' prop
  if (as === "button" || onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={combinedClasses}
      >
        {glowElement}
        {children}
      </button>
    );
  }
  
  if (as === "a" || href) {
    return (
      <a
        href={href}
        className={combinedClasses}
      >
        {glowElement}
        {children}
      </a>
    );
  }
  
  return (
    <div className={combinedClasses}>
      {glowElement}
      {children}
    </div>
  );
});

Card.displayName = "Card";

export default Card;



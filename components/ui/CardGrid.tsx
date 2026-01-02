"use client";

import { memo, ReactNode } from "react";

export interface CardGridProps {
  children: ReactNode;
  columns?: {
    mobile?: 1 | 2;
    tablet?: 2 | 3;
    desktop?: 3 | 4;
  };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const CardGrid = memo(function CardGrid({
  children,
  columns = {
    mobile: 2,
    tablet: 3,
    desktop: 4,
  },
  gap = "md",
  className = "",
}: CardGridProps) {
  const { mobile = 2, tablet = 3, desktop = 4 } = columns;
  
  // Map to Tailwind grid classes
  const gridColsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };
  
  const gridColsClass = `${gridColsMap[mobile]} ${gridColsMap[tablet] ? `sm:${gridColsMap[tablet]}` : ""} ${gridColsMap[desktop] ? `md:${gridColsMap[desktop]}` : ""}`;
  
  const gapClass = {
    sm: "gap-2",
    md: "gap-2 sm:gap-3",
    lg: "gap-3 sm:gap-4",
  }[gap];
  
  const combinedClasses = `grid ${gridColsClass} ${gapClass} ${className}`.trim();
  
  return <div className={combinedClasses}>{children}</div>;
});

CardGrid.displayName = "CardGrid";

export default CardGrid;


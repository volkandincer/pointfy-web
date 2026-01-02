"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { getIconBadgeClasses, getIconColor, type CardBorderColor } from "@/lib/design-utils";

export interface IconBadgeProps {
  icon: LucideIcon;
  color?: CardBorderColor;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const IconBadge = memo(function IconBadge({
  icon: Icon,
  color = "primary",
  size = "md",
  className = "",
}: IconBadgeProps) {
  const badgeClasses = getIconBadgeClasses(color);
  const iconColorClasses = getIconColor(color);
  
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12 sm:h-14 sm:w-14",
    lg: "h-14 w-14 sm:h-16 sm:w-16",
  }[size];
  
  const iconSizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6 sm:h-7 sm:w-7",
    lg: "h-7 w-7 sm:h-8 sm:w-8",
  }[size];
  
  const combinedClasses = `${badgeClasses} ${sizeClasses} ${className}`.trim();
  
  return (
    <div className={combinedClasses}>
      <Icon className={`${iconSizeClasses} ${iconColorClasses}`} />
    </div>
  );
});

IconBadge.displayName = "IconBadge";

export default IconBadge;



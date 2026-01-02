/**
 * Design Utilities - TeamHubX Design System
 * 
 * Utility functions for generating consistent design classes and components.
 */

// Card border colors based on category/type
export type CardBorderColor = 
  | "blue" 
  | "green" 
  | "purple" 
  | "pink" 
  | "indigo" 
  | "cyan" 
  | "orange" 
  | "red"
  | "yellow"
  | "primary";

/**
 * Get border color classes for cards
 */
export function getCardBorderColor(color: CardBorderColor): string {
  const colorMap: Record<CardBorderColor, string> = {
    blue: "border-l-blue-600 dark:border-l-blue-500",
    green: "border-l-green-600 dark:border-l-green-500",
    purple: "border-l-purple-600 dark:border-l-purple-500",
    pink: "border-l-pink-600 dark:border-l-pink-500",
    indigo: "border-l-indigo-600 dark:border-l-indigo-500",
    cyan: "border-l-cyan-600 dark:border-l-cyan-500",
    orange: "border-l-orange-600 dark:border-l-orange-500",
    red: "border-l-red-600 dark:border-l-red-500",
    yellow: "border-l-yellow-600 dark:border-l-yellow-500",
    primary: "border-l-primary dark:border-l-primary",
  };
  
  return colorMap[color] || colorMap.primary;
}

/**
 * Get icon color classes based on card border color
 */
export function getIconColor(color: CardBorderColor): string {
  const colorMap: Record<CardBorderColor, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
    pink: "text-pink-600 dark:text-pink-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    orange: "text-orange-600 dark:text-orange-400",
    red: "text-red-600 dark:text-red-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    primary: "text-primary dark:text-primary",
  };
  
  return colorMap[color] || colorMap.primary;
}

/**
 * Get base card classes with modern design
 */
export function getCardClasses(options?: {
  borderColor?: CardBorderColor;
  minHeight?: "sm" | "md" | "lg";
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}): string {
  const {
    borderColor = "primary",
    minHeight = "md",
    padding = "md",
    interactive = true,
  } = options || {};
  
  const borderColorClass = getCardBorderColor(borderColor);
  const minHeightClass = {
    sm: "min-h-[100px]",
    md: "min-h-[120px]",
    lg: "min-h-[140px]",
  }[minHeight];
  
  const paddingClass = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  }[padding];
  
  const baseClasses = [
    "group",
    "relative",
    "flex",
    "flex-col",
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
    paddingClass,
    "shadow-md",
    "transition-all",
    "duration-300",
  ];
  
  if (interactive) {
    baseClasses.push(
      "hover:scale-[1.02]",
      "hover:border-border",
      "hover:shadow-xl"
    );
  }
  
  baseClasses.push(minHeightClass);
  
  return baseClasses.join(" ");
}

/**
 * Get hover effect classes
 */
export function getHoverClasses(): string {
  return "hover:scale-[1.02] hover:border-border hover:shadow-xl transition-all duration-300";
}

/**
 * Get glow effect component classes
 */
export function getGlowEffectClasses(color: CardBorderColor = "primary"): string {
  const colorMap: Record<CardBorderColor, string> = {
    blue: "from-blue-500/10 to-blue-500/5",
    green: "from-green-500/10 to-green-500/5",
    purple: "from-purple-500/10 to-purple-500/5",
    pink: "from-pink-500/10 to-pink-500/5",
    indigo: "from-indigo-500/10 to-indigo-500/5",
    cyan: "from-cyan-500/10 to-cyan-500/5",
    orange: "from-orange-500/10 to-orange-500/5",
    red: "from-red-500/10 to-red-500/5",
    yellow: "from-yellow-500/10 to-yellow-500/5",
    primary: "from-primary/10 to-primary/5",
  };
  
  return [
    "absolute",
    "right-0",
    "top-0",
    "h-24",
    "w-24",
    "translate-x-6",
    "-translate-y-6",
    "rounded-full",
    "bg-gradient-to-br",
    colorMap[color],
    "blur-xl",
    "transition-all",
    "group-hover:scale-150",
  ].join(" ");
}

/**
 * Get icon badge background classes
 */
export function getIconBadgeClasses(color: CardBorderColor = "primary"): string {
  const colorMap: Record<CardBorderColor, string> = {
    blue: "from-blue-500/20 to-transparent",
    green: "from-green-500/20 to-transparent",
    purple: "from-purple-500/20 to-transparent",
    pink: "from-pink-500/20 to-transparent",
    indigo: "from-indigo-500/20 to-transparent",
    cyan: "from-cyan-500/20 to-transparent",
    orange: "from-orange-500/20 to-transparent",
    red: "from-red-500/20 to-transparent",
    yellow: "from-yellow-500/20 to-transparent",
    primary: "from-primary/20 to-transparent",
  };
  
  return [
    "flex",
    "items-center",
    "justify-center",
    "rounded-lg",
    "bg-gradient-to-br",
    colorMap[color],
    "transition-transform",
    "group-hover:scale-110",
  ].join(" ");
}

/**
 * Section header classes
 */
export function getSectionHeaderClasses(): {
  container: string;
  title: string;
  description: string;
} {
  return {
    container: "mb-3 sm:mb-4",
    title: "mb-0.5 text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl",
    description: "text-xs text-muted-foreground sm:text-sm",
  };
}



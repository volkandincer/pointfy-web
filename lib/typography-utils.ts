/**
 * Typography Utility Functions
 * 
 * Utility functions for generating consistent typography classes.
 */

/**
 * Get heading classes based on level and size
 */
export function getHeadingClasses(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  size: "sm" | "md" | "lg" = "md"
): string {
  const sizeClasses = {
    sm: {
      1: "text-2xl sm:text-3xl",
      2: "text-xl sm:text-2xl",
      3: "text-lg sm:text-xl",
      4: "text-base sm:text-lg",
      5: "text-sm sm:text-base",
      6: "text-xs sm:text-sm",
    },
    md: {
      1: "text-3xl sm:text-4xl",
      2: "text-2xl sm:text-3xl",
      3: "text-xl sm:text-2xl",
      4: "text-lg sm:text-xl",
      5: "text-base sm:text-lg",
      6: "text-sm sm:text-base",
    },
    lg: {
      1: "text-4xl sm:text-5xl",
      2: "text-3xl sm:text-4xl",
      3: "text-2xl sm:text-3xl",
      4: "text-xl sm:text-2xl",
      5: "text-lg sm:text-xl",
      6: "text-base sm:text-lg",
    },
  };

  const weightClasses = {
    1: "font-bold",
    2: "font-bold",
    3: "font-semibold",
    4: "font-semibold",
    5: "font-medium",
    6: "font-medium",
  };

  return `${sizeClasses[size][level]} ${weightClasses[level]} text-card-foreground tracking-tight`;
}

/**
 * Get text classes based on variant
 */
export function getTextClasses(
  variant: "body" | "small" | "caption" = "body",
  muted: boolean = false
): string {
  const variantClasses = {
    body: "text-sm sm:text-base",
    small: "text-xs sm:text-sm",
    caption: "text-xs",
  };

  const colorClass = muted ? "text-muted-foreground" : "text-card-foreground";
  const weightClass = variant === "caption" ? "font-normal" : "font-normal";

  return `${variantClasses[variant]} ${colorClass} ${weightClass}`;
}

/**
 * Get label classes
 */
export function getLabelClasses(size: "sm" | "md" = "md"): string {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
  };

  return `${sizeClasses[size]} font-medium text-card-foreground`;
}

/**
 * Get heading size class (responsive)
 */
export function getHeadingSizeClass(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  responsive: boolean = true
): string {
  const baseSizes = {
    1: "text-3xl",
    2: "text-2xl",
    3: "text-xl",
    4: "text-lg",
    5: "text-base",
    6: "text-sm",
  };

  const responsiveSizes = {
    1: "text-3xl sm:text-4xl",
    2: "text-2xl sm:text-3xl",
    3: "text-xl sm:text-2xl",
    4: "text-lg sm:text-xl",
    5: "text-base sm:text-lg",
    6: "text-sm sm:text-base",
  };

  return responsive ? responsiveSizes[level] : baseSizes[level];
}

/**
 * Get body text class
 */
export function getBodyTextClass(size: "sm" | "md" | "lg" = "md"): string {
  const sizeClasses = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-base sm:text-lg",
  };

  return `${sizeClasses[size]} text-card-foreground font-normal`;
}



/**
 * Text Color Mapping Utility
 * 
 * Maps old text color classes to new design token-based classes.
 * Provides automatic dark mode support.
 */

/**
 * Text color variants
 */
export type TextColorVariant = 
  | "foreground" 
  | "muted" 
  | "primary" 
  | "destructive"
  | "card-foreground";

/**
 * Get text color class based on variant
 */
export function getTextColorClass(variant: TextColorVariant): string {
  const colorMap: Record<TextColorVariant, string> = {
    foreground: "text-foreground",
    muted: "text-muted-foreground",
    primary: "text-primary",
    destructive: "text-destructive",
    "card-foreground": "text-card-foreground",
  };

  return colorMap[variant] || colorMap.foreground;
}

/**
 * Map old gray text colors to new design tokens
 * 
 * Mapping rules:
 * - text-gray-900 → text-card-foreground (main text)
 * - text-gray-700 → text-card-foreground (slightly muted but still main)
 * - text-gray-600 → text-muted-foreground (muted text)
 * - text-gray-500 → text-muted-foreground (more muted)
 * - text-gray-400 → text-muted-foreground (very muted)
 * - text-white → text-card-foreground (on dark backgrounds)
 * - text-black → text-foreground (on light backgrounds)
 */
export function mapOldTextColor(oldColor: string): string {
  const mapping: Record<string, string> = {
    // Gray scale mappings
    "text-gray-900": "text-card-foreground",
    "text-gray-800": "text-card-foreground",
    "text-gray-700": "text-card-foreground",
    "text-gray-600": "text-muted-foreground",
    "text-gray-500": "text-muted-foreground",
    "text-gray-400": "text-muted-foreground",
    "text-gray-300": "text-muted-foreground",
    
    // White/Black mappings
    "text-white": "text-card-foreground",
    "text-black": "text-foreground",
    
    // Dark mode specific (these should be removed, handled by design tokens)
    "dark:text-gray-300": "text-card-foreground",
    "dark:text-gray-400": "text-muted-foreground",
    "dark:text-white": "text-card-foreground",
    "dark:text-gray-200": "text-card-foreground",
  };

  // Check for exact match first
  if (mapping[oldColor]) {
    return mapping[oldColor];
  }

  // Check for dark mode variants (remove dark: prefix and map)
  if (oldColor.startsWith("dark:text-")) {
    const baseColor = oldColor.replace("dark:text-", "text-");
    if (mapping[baseColor]) {
      return mapping[baseColor];
    }
  }

  // If no mapping found, return original (might be a valid design token)
  return oldColor;
}

/**
 * Replace old text color classes in a className string
 */
export function replaceOldTextColors(className: string): string {
  const oldColorPatterns = [
    /text-gray-900/g,
    /text-gray-800/g,
    /text-gray-700/g,
    /text-gray-600/g,
    /text-gray-500/g,
    /text-gray-400/g,
    /text-gray-300/g,
    /text-white(?![-\w])/g, // Don't match text-white-* variants
    /text-black(?![-\w])/g, // Don't match text-black-* variants
    /dark:text-gray-300/g,
    /dark:text-gray-400/g,
    /dark:text-white(?![-\w])/g,
    /dark:text-gray-200/g,
  ];

  let result = className;
  
  oldColorPatterns.forEach((pattern) => {
    const match = result.match(pattern);
    if (match) {
      const mapped = mapOldTextColor(match[0]);
      result = result.replace(pattern, mapped);
    }
  });

  return result;
}

/**
 * Determine appropriate text color variant based on context
 * 
 * @param isMainText - Is this the main text content?
 * @param isMuted - Should this be muted/secondary?
 * @param isPrimary - Is this a primary action/important?
 * @param isDestructive - Is this an error/warning?
 */
export function getTextColorVariant(
  isMainText: boolean = true,
  isMuted: boolean = false,
  isPrimary: boolean = false,
  isDestructive: boolean = false
): TextColorVariant {
  if (isDestructive) return "destructive";
  if (isPrimary) return "primary";
  if (isMuted) return "muted";
  if (isMainText) return "card-foreground";
  return "foreground";
}



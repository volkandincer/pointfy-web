/**
 * Design Tokens - TeamHubX Design System
 * 
 * Centralized design tokens for consistent styling across the application.
 * Based on OKLCH color system and Tailwind CSS utilities.
 */

// Color Palette (OKLCH based - matches globals.css)
export const colors = {
  // Primary colors
  primary: "oklch(0.55 0.22 280)", // Modern Indigo/Mor
  primaryForeground: "oklch(0.98 0 0)",
  
  // Background colors
  background: {
    light: "oklch(1 0 0)",
    dark: "oklch(0.08 0 0)",
  },
  
  // Card colors
  card: {
    light: "oklch(1 0 0)",
    dark: "oklch(0.15 0 0)",
  },
  
  // Border colors
  border: {
    light: "oklch(0.922 0 0)",
    dark: "oklch(0.2 0 0)",
  },
  
  // Muted colors
  muted: {
    light: "oklch(0.97 0 0)",
    dark: "oklch(0.18 0 0)",
  },
  
  // Destructive colors
  destructive: {
    light: "oklch(0.577 0.245 27.325)",
    dark: "oklch(0.6 0.25 25)",
  },
} as const;

// Spacing Scale (4px base unit)
export const spacing = {
  xs: "0.25rem",    // 4px
  sm: "0.5rem",     // 8px
  md: "0.75rem",    // 12px
  base: "1rem",     // 16px
  lg: "1.5rem",     // 24px
  xl: "2rem",       // 32px
  "2xl": "2.5rem",  // 40px
  "3xl": "3rem",    // 48px
} as const;

// Border Radius Scale
export const borderRadius = {
  none: "0",
  sm: "0.25rem",    // 4px
  md: "0.375rem",   // 6px
  lg: "0.5rem",     // 8px
  xl: "0.75rem",    // 12px
  "2xl": "1rem",    // 16px
} as const;

// Shadow Scale
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

// Typography Scale
export const typography = {
  // Font sizes
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem",  // 36px
    "5xl": "3rem",     // 48px
  },
  
  // Font weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  
  // Line heights
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
} as const;

// Transition Durations
export const transitions = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// Card Design Tokens
export const cardDesign = {
  // Border widths
  borderWidth: {
    left: "4px",
    sides: "2px",
  },
  
  // Padding
  padding: {
    sm: "0.75rem",  // 12px (p-3)
    md: "1rem",     // 16px (p-4)
    lg: "1.5rem",   // 24px (p-6)
  },
  
  // Min heights
  minHeight: {
    sm: "100px",
    md: "120px",
    lg: "140px",
  },
  
  // Glow effect sizes
  glow: {
    size: "6rem",      // 96px (h-24 w-24)
    blur: "3xl",       // blur-xl
    translateX: "1.5rem", // 24px (translate-x-6)
    translateY: "-1.5rem", // -24px (-translate-y-6)
  },
} as const;

// Hover Effect Tokens
export const hoverEffects = {
  scale: "1.02",
  shadow: {
    base: "md",
    hover: "xl",
  },
  transition: "all duration-300",
} as const;

// Export type for TypeScript
export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;



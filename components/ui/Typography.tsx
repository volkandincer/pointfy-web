"use client";

import { memo, forwardRef } from "react";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";

// Heading Component
export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "sm" | "md" | "lg";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading = memo(
  forwardRef<HTMLHeadingElement, HeadingProps>(
    ({ level = 1, size = "md", as, className = "", children, ...props }, ref) => {
      const Component = (as || `h${level}`) as ElementType;
      
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

      const baseClasses = "text-card-foreground tracking-tight";
      const combinedClasses = cn(
        baseClasses,
        sizeClasses[size][level],
        weightClasses[level],
        className
      );

      return (
        <Component ref={ref} className={combinedClasses} {...props}>
          {children}
        </Component>
      );
    }
  )
);

Heading.displayName = "Heading";

// Text Component
export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "body" | "small" | "caption";
  as?: "p" | "span" | "div";
  muted?: boolean;
}

const Text = memo(
  forwardRef<HTMLParagraphElement, TextProps>(
    ({ variant = "body", as = "p", muted = false, className = "", children, ...props }, ref) => {
      const Component = as;

      const variantClasses = {
        body: "text-sm sm:text-base",
        small: "text-xs sm:text-sm",
        caption: "text-xs",
      };

      const colorClass = muted ? "text-muted-foreground" : "text-card-foreground";
      const weightClass = variant === "caption" ? "font-normal" : "font-normal";

      const combinedClasses = cn(
        variantClasses[variant],
        colorClass,
        weightClass,
        className
      );

      return (
        <Component ref={ref} className={combinedClasses} {...props}>
          {children}
        </Component>
      );
    }
  )
);

Text.displayName = "Text";

// Label Component
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  size?: "sm" | "md";
}

const Label = memo(
  forwardRef<HTMLLabelElement, LabelProps>(
    ({ required = false, size = "md", className = "", children, ...props }, ref) => {
      const sizeClasses = {
        sm: "text-xs",
        md: "text-sm",
      };

      const baseClasses = "font-medium text-card-foreground";
      const combinedClasses = cn(
        baseClasses,
        sizeClasses[size],
        className
      );

      return (
        <label ref={ref} className={combinedClasses} {...props}>
          {children}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      );
    }
  )
);

Label.displayName = "Label";

export { Heading, Text, Label };



"use client";

import { memo, forwardRef } from "react";
import Link from "next/link";
import { Loader2, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  href?: string;
  asLink?: boolean;
  showArrow?: boolean;
}

const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        variant = "primary",
        size = "md",
        loading = false,
        icon: Icon,
        iconPosition = "left",
        fullWidth = false,
        href,
        asLink = false,
        showArrow = false,
        className = "",
        disabled,
        children,
        ...props
      },
      ref
    ) => {
      // Base classes
      const baseClasses = "inline-flex items-center justify-center gap-2 rounded-md border-2 font-semibold transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

      // Variant classes
      const variantClasses = {
        primary:
          "border-blue-600 bg-blue-600 text-white shadow-sm hover:border-blue-700 hover:bg-blue-700 hover:shadow-md active:border-blue-800 active:bg-blue-800 active:shadow-md focus:ring-blue-500/20 dark:border-blue-500 dark:bg-blue-600 dark:hover:border-blue-600 dark:hover:bg-blue-700",
        secondary:
          "border-gray-300 bg-white text-gray-900 shadow-sm hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:border-gray-500 active:bg-gray-100 active:shadow-md focus:ring-gray-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-700",
        outline:
          "border-blue-600 bg-transparent text-blue-600 hover:border-blue-700 hover:bg-blue-50 hover:text-blue-700 active:border-blue-800 active:bg-blue-100 active:text-blue-800 focus:ring-blue-500/20 dark:border-blue-500 dark:text-blue-400 dark:hover:border-blue-400 dark:hover:bg-blue-900/20",
        ghost:
          "border-transparent bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 active:text-gray-900 focus:ring-gray-500/20 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
        danger:
          "border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 hover:shadow-md active:border-red-800 active:bg-red-800 active:shadow-md focus:ring-red-500/20 dark:border-red-500 dark:bg-red-600 dark:hover:border-red-600 dark:hover:bg-red-700",
      };

      // Size classes
      const sizeClasses = {
        sm: "px-3 py-1.5 text-xs min-h-[36px]",
        md: "px-4 py-2.5 text-sm min-h-[44px]",
        lg: "px-6 py-3.5 text-base min-h-[52px]",
      };

      // Width classes
      const widthClasses = fullWidth ? "w-full" : "";

      // Combine all classes
      const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`;

      // Determine which icon to show
      const showIcon = Icon && !loading;
      const showLoadingIcon = loading;

      // If href is provided, render as Link
      if (href || asLink) {
        return (
          <Link
            href={href || "#"}
            className={combinedClasses}
            {...(props as React.ComponentProps<typeof Link>)}
          >
            {showIcon && iconPosition === "left" && Icon && (
              <Icon className="h-4 w-4" aria-hidden="true" />
            )}
            {children && <span>{children}</span>}
            {showIcon && iconPosition === "right" && Icon && (
              <Icon className="h-4 w-4" aria-hidden="true" />
            )}
            {showArrow && (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </Link>
        );
      }

      return (
        <button
          ref={ref}
          type="button"
          disabled={disabled || loading}
          className={combinedClasses}
          {...props}
        >
          {showLoadingIcon && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {showIcon && iconPosition === "left" && (
            <Icon className="h-4 w-4" aria-hidden="true" />
          )}
          {children && <span>{children}</span>}
          {showIcon && iconPosition === "right" && (
            <Icon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      );
    }
  )
);

Button.displayName = "Button";

export default Button;


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
          "border-primary bg-primary text-primary-foreground shadow-sm hover:border-primary hover:bg-primary/90 hover:shadow-md active:border-primary active:bg-primary/80 active:shadow-md focus:ring-primary/20",
        secondary:
          "border-border bg-card text-card-foreground shadow-sm hover:border-border hover:bg-accent hover:text-accent-foreground hover:shadow-md active:border-border active:bg-accent active:shadow-md focus:ring-border/20",
        outline:
          "border-primary bg-transparent text-primary hover:border-primary hover:bg-primary/10 hover:text-primary active:border-primary active:bg-primary/20 active:text-primary focus:ring-primary/20",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground focus:ring-border/20",
        danger:
          "border-destructive bg-destructive text-destructive-foreground shadow-sm hover:border-destructive hover:bg-destructive/90 hover:shadow-md active:border-destructive active:bg-destructive/80 active:shadow-md focus:ring-destructive/20",
      };

      // Size classes
      const sizeClasses = {
        sm: "px-3 py-1.5 text-xs min-h-[36px]",
        md: "px-4 py-2.5 text-xs min-h-[44px]",
        lg: "px-6 py-3.5 text-sm min-h-[52px]",
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
        // Extract href from props to avoid duplicate
        const { href: propsHref, ...linkProps } = props as React.ComponentProps<typeof Link>;
        return (
          <Link
            href={href || propsHref || "#"}
            className={combinedClasses}
            {...linkProps}
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


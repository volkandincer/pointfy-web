"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import Button from "@/components/ui/Button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  variant?: "default" | "modern";
}

const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
  variant = "modern",
}: EmptyStateProps) {
  // Modern variant with gradient and glow effects
  if (variant === "modern") {
    return (
      <div
        className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-6 text-center shadow-md sm:p-8 md:p-12 ${className}`}
      >
        {/* Glow Effect */}
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-2xl transition-all group-hover:scale-150" />
        
        {/* Icon */}
        <div className="relative mb-4 flex justify-center sm:mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-transparent sm:h-20 sm:w-20 md:h-24 md:w-24">
            <Icon className="h-8 w-8 text-primary sm:h-10 sm:w-10 md:h-12 md:w-12" />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="relative mb-2 text-lg font-bold text-foreground sm:text-xl">
          {title}
        </h3>
        
        {/* Description */}
        {description && (
          <p className="relative mb-4 max-w-md text-xs text-muted-foreground sm:mb-6 sm:text-sm">
            {description}
          </p>
        )}
        
        {/* Action Button */}
        {actionLabel && onAction && (
          <div className="relative">
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  // Default variant (backward compatible)
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md border-2 border-border bg-card p-6 text-center shadow-sm sm:p-8 md:p-12 ${className}`}
    >
      <div className="mb-4 flex justify-center sm:mb-6">
        <div className="relative">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-md border-2 border-border bg-muted sm:h-20 sm:w-20 md:h-24 md:w-24">
            <Icon className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10 md:h-12 md:w-12" />
          </div>
        </div>
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground sm:text-xl">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-md text-xs text-muted-foreground sm:mb-6 sm:text-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = "EmptyState";

export default EmptyState;



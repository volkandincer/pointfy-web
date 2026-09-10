"use client";

import { memo } from "react";
import { LucideIcon } from "lucide-react";
import Button from "@/components/ui/Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-border bg-card p-10 text-center ${className}`}
    >
      {/* Icon Box - Modern Minimal */}
      <div className="mb-5 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-sm font-bold text-card-foreground">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
});

export default EmptyState;


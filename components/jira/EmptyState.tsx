"use client";

import { memo } from "react";
import { LucideIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import IconBadge from "@/components/ui/IconBadge";

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
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-6 text-center shadow-md sm:p-8 md:p-12 ${className}`}
    >
      <div className="mb-4 flex justify-center sm:mb-6">
        <IconBadge
          icon={Icon}
          color="primary"
          size="lg"
          className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
        />
      </div>
      <h3 className="mb-2 text-lg font-bold text-card-foreground sm:text-xl">
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

export default EmptyState;


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
      className={`flex flex-col items-center justify-center rounded-lg border border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      {/* Icon Box - Modern Minimal */}
      <div className="mb-5 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          <Icon className="h-7 w-7 text-gray-500 dark:text-gray-400" />
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-sm text-xs leading-relaxed text-gray-600 dark:text-gray-400">
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


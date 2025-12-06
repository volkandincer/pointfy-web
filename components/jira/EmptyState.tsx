"use client";

import { memo } from "react";
import { LucideIcon } from "lucide-react";

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
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-white p-6 text-center shadow-sm sm:p-8 md:p-12 dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <div className="mb-4 flex justify-center sm:mb-6">
        <div className="relative">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border-2 border-gray-300 bg-gray-50 sm:h-20 sm:w-20 md:h-24 md:w-24 dark:border-gray-700 dark:bg-gray-800">
            <Icon className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10 md:h-12 md:w-12 dark:text-gray-500" />
          </div>
        </div>
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-md text-xs text-gray-600 dark:text-gray-400 sm:mb-6 sm:text-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="min-h-[44px] rounded-lg border-2 border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:border-blue-700 active:bg-blue-700 active:shadow-md sm:px-6 sm:py-3 hover:border-blue-700 hover:bg-blue-700 hover:shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
});

export default EmptyState;


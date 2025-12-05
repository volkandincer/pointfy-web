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
      className={`flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
            <Icon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:from-blue-700 hover:to-blue-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
});

export default EmptyState;


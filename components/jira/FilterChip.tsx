"use client";

import { memo } from "react";
import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  color?: "blue" | "green" | "purple" | "orange" | "gray";
}

const FilterChip = memo(function FilterChip({
  label,
  value,
  onRemove,
  color = "blue",
}: FilterChipProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    green: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    purple: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  };

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm ${colorClasses[color]}`}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
});

export default FilterChip;


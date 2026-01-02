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
  onRemove,
  color = "blue",
}: FilterChipProps) {
  const colorClasses = {
    blue: "bg-primary/10 text-primary border-primary/30",
    green: "bg-success/10 text-success border-success/30",
    purple: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    gray: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm ${colorClasses[color]}`}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-md p-0.5 transition-colors hover:bg-foreground/10"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
});

export default FilterChip;


"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";

export interface TabItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  color?: "blue" | "purple" | "green" | "yellow" | "red" | "primary";
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  fullWidth?: boolean;
}

const Tabs = memo(function Tabs({
  items,
  value,
  onChange,
  className = "",
  fullWidth = true,
}: TabsProps) {
  const getColorClasses = (color: TabItem["color"] = "primary", isSelected: boolean) => {
    if (!isSelected) {
      return "border-transparent text-muted-foreground hover:border-border hover:text-foreground";
    }

    const colorMap = {
      primary: "border-primary text-primary",
      blue: "border-blue-600 text-blue-600 dark:text-blue-400",
      purple: "border-purple-600 text-purple-600 dark:text-purple-400",
      green: "border-green-600 text-green-600 dark:text-green-400",
      yellow: "border-yellow-600 text-yellow-600 dark:text-yellow-400",
      red: "border-red-600 text-red-600 dark:text-red-400",
    };

    return colorMap[color];
  };

  return (
    <div className={className}>
      <div className="border-b border-border">
        <div className={`flex gap-0 ${fullWidth ? "w-full" : ""}`}>
          {items.map((item) => {
            const isSelected = value === item.key;
            const Icon = item.icon;
            const colorClasses = getColorClasses(item.color, isSelected);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${colorClasses} ${
                  isSelected ? "" : "border-transparent"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default Tabs;


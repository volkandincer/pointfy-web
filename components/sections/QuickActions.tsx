"use client";

import Link from "next/link";
import { memo } from "react";
import { 
  Zap, 
  Link2, 
  ClipboardList, 
  CheckSquare, 
  FileText, 
  BarChart3, 
  RotateCcw,
  Settings,
  type LucideIcon 
} from "lucide-react";
import type { QuickAction } from "@/interfaces/QuickAction.interface";

interface QuickActionsProps {
  actions: QuickAction[];
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  "create-room": Zap,
  "jira": Link2,
  "boards": ClipboardList,
  "personal-tasks": CheckSquare,
  "notes": FileText,
  "voted-tasks": BarChart3,
  "retro": RotateCcw,
  "account": Settings,
};

// Color mapping for left border
const colorMap: Record<string, string> = {
  "create-room": "border-l-blue-600 dark:border-l-blue-500",
  "jira": "border-l-purple-600 dark:border-l-purple-500",
  "boards": "border-l-green-600 dark:border-l-green-500",
  "personal-tasks": "border-l-orange-600 dark:border-l-orange-500",
  "notes": "border-l-yellow-600 dark:border-l-yellow-500",
  "voted-tasks": "border-l-indigo-600 dark:border-l-indigo-500",
  "retro": "border-l-pink-600 dark:border-l-pink-500",
  "account": "border-l-cyan-600 dark:border-l-cyan-500",
};

// Icon color mapping
const iconColorMap: Record<string, string> = {
  "create-room": "text-blue-600 dark:text-blue-400",
  "jira": "text-purple-600 dark:text-purple-400",
  "boards": "text-green-600 dark:text-green-400",
  "personal-tasks": "text-orange-600 dark:text-orange-400",
  "notes": "text-yellow-600 dark:text-yellow-400",
  "voted-tasks": "text-indigo-600 dark:text-indigo-400",
  "retro": "text-pink-600 dark:text-pink-400",
  "account": "text-cyan-600 dark:text-cyan-400",
};

const QuickActions = memo(function QuickActions({ actions }: QuickActionsProps) {
  const getIcon = (actionId: string) => {
    const IconComponent = iconMap[actionId];
    const iconColor = iconColorMap[actionId] || "text-gray-700 dark:text-gray-300";
    return IconComponent ? <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} /> : null;
  };

  const getBorderColor = (actionId: string) => {
    return colorMap[actionId] || "border-l-blue-600 dark:border-l-blue-500";
  };

  const getIconBgColor = (actionId: string) => {
    const bgMap: Record<string, string> = {
      "create-room": "bg-blue-50 dark:bg-blue-900/20",
      "jira": "bg-purple-50 dark:bg-purple-900/20",
      "boards": "bg-green-50 dark:bg-green-900/20",
      "personal-tasks": "bg-orange-50 dark:bg-orange-900/20",
      "notes": "bg-yellow-50 dark:bg-yellow-900/20",
      "voted-tasks": "bg-indigo-50 dark:bg-indigo-900/20",
      "retro": "bg-pink-50 dark:bg-pink-900/20",
      "account": "bg-cyan-50 dark:bg-cyan-900/20",
    };
    return bgMap[actionId] || "bg-gray-50 dark:bg-gray-800";
  };

  return (
    <section className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl">

        {/* Tüm Action'lar - Kompakt Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {actions.map((action) => {
            const IconComponent = getIcon(action.id);
            const borderColor = getBorderColor(action.id);
            const iconBg = getIconBgColor(action.id);
            
            const baseClasses = `group relative flex min-h-[110px] flex-col items-center justify-center border-l-4 ${borderColor} border-t border-r border-b border-border bg-card p-4 text-center shadow-sm transition-all sm:min-h-[130px] sm:p-5 hover:border-border hover:shadow-md`;
            
            return action.onClick ? (
              <button
                key={action.id}
                onClick={action.onClick}
                className={baseClasses}
              >
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-border ${iconBg} transition-colors group-hover:border-border sm:mb-4 sm:h-14 sm:w-14`}>
                  {IconComponent}
                </div>
                <h3 className="mb-1.5 text-xs font-semibold text-card-foreground sm:text-sm">
                  {action.title}
                </h3>
                <p className="hidden text-[10px] leading-tight text-muted-foreground sm:block sm:text-xs">
                  {action.description}
                </p>
              </button>
            ) : (
              <Link
                key={action.id}
                href={action.href}
                className={baseClasses}
              >
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-border ${iconBg} transition-colors group-hover:border-border sm:mb-4 sm:h-14 sm:w-14`}>
                  {IconComponent}
                </div>
                <h3 className="mb-1.5 text-xs font-semibold text-card-foreground sm:text-sm">
                  {action.title}
                </h3>
                <p className="hidden text-[10px] leading-tight text-muted-foreground sm:block sm:text-xs">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default QuickActions;



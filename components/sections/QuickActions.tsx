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
    const iconColor = iconColorMap[actionId] || "text-card-foreground";
    return IconComponent ? <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColor}`} /> : null;
  };

  const getBorderColor = (actionId: string) => {
    return colorMap[actionId] || "border-l-blue-600 dark:border-l-blue-500";
  };

  return (
    <section className="container mx-auto px-4 py-4 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 sm:mb-4">
          <h2 className="mb-0.5 text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
            Hızlı İşlemler
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Takım çalışmanızı başlatın
          </p>
        </div>

        {/* Tüm Action'lar - Kompakt Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
          {actions.map((action) => {
            const IconComponent = getIcon(action.id);
            const borderColor = getBorderColor(action.id);
            
            const baseClasses = `group relative flex min-h-[100px] flex-col items-center justify-center overflow-hidden rounded-lg border-l-4 ${borderColor} border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 text-center shadow-md transition-all duration-300 active:border-border active:shadow-lg sm:min-h-[120px] sm:p-4 hover:scale-[1.02] hover:border-border hover:shadow-xl`;
            
            return action.onClick ? (
              <button
                key={action.id}
                onClick={action.onClick}
                className={baseClasses}
              >
                <div className="mb-2 sm:mb-2.5">
                  {IconComponent}
                </div>
                <h3 className="mb-1 text-xs font-semibold text-card-foreground sm:text-sm">
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
                {/* Glow Effect */}
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
                
                <div className="relative mb-2 sm:mb-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
                    {IconComponent}
                  </div>
                </div>
                <h3 className="mb-1 text-xs font-semibold text-card-foreground sm:text-sm">
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



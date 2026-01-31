"use client";

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
import FeatureCard from "./FeatureCard";

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

// Color mapping
const colorMap: Record<string, string> = {
  "create-room": "blue",
  "jira": "purple",
  "boards": "green",
  "personal-tasks": "orange",
  "notes": "yellow",
  "voted-tasks": "cyan",
  "retro": "pink",
  "account": "teal",
};

const QuickActions = memo(function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="container mx-auto px-4 pt-0 pb-8 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action) => {
          const IconComponent = iconMap[action.id];
          const color = colorMap[action.id] || "blue";
          
          if (!IconComponent) return null;
          
          return (
            <FeatureCard
              key={action.id}
              action={action}
              icon={IconComponent}
              color={color}
            />
          );
        })}
      </div>
    </section>
  );
});

export default QuickActions;

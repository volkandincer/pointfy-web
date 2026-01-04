"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: "primary" | "blue" | "green" | "purple" | "yellow" | "red";
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = memo(function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = "primary",
  actions,
  className = "",
}: PageHeaderProps) {
  const iconColorClasses = {
    primary: {
      container: "border-primary bg-primary/10 dark:bg-primary/20",
      icon: "text-primary dark:text-primary",
    },
    blue: {
      container: "border-blue-600 bg-blue-50 dark:bg-blue-900/20",
      icon: "text-blue-600 dark:text-blue-400",
    },
    green: {
      container: "border-green-600 bg-green-50 dark:bg-green-900/20",
      icon: "text-green-600 dark:text-green-400",
    },
    purple: {
      container: "border-purple-600 bg-purple-50 dark:bg-purple-900/20",
      icon: "text-purple-600 dark:text-purple-400",
    },
    yellow: {
      container: "border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
      icon: "text-yellow-600 dark:text-yellow-400",
    },
    red: {
      container: "border-red-600 bg-red-50 dark:bg-red-900/20",
      icon: "text-red-600 dark:text-red-400",
    },
  };

  const colors = iconColorClasses[iconColor];

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 ${colors.container}`}
              >
                <Icon className={`h-5 w-5 ${colors.icon}`} />
              </div>
            )}
            <div className="flex h-10 min-w-0 flex-1 flex-col justify-center">
              <h1 className="text-base font-semibold leading-tight text-foreground sm:text-lg">
                {title}
              </h1>
              {description && (
                <p className="mt-0.5 text-sm leading-tight text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
});

export default PageHeader;


"use client";

import { memo, ReactNode } from "react";
import { getSectionHeaderClasses } from "@/lib/design-utils";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const SectionHeader = memo(function SectionHeader({
  title,
  description,
  action,
  className = "",
}: SectionHeaderProps) {
  const classes = getSectionHeaderClasses();
  
  return (
    <div className={`${classes.container} ${className}`.trim()}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className={classes.title}>{title}</h2>
          {description && (
            <p className={classes.description}>{description}</p>
          )}
        </div>
        {action && (
          <div className="shrink-0">{action}</div>
        )}
      </div>
    </div>
  );
});

SectionHeader.displayName = "SectionHeader";

export default SectionHeader;



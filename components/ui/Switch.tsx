"use client";

import { memo } from "react";
import type { InputHTMLAttributes } from "react";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
}

const Switch = memo(function Switch({
  label,
  description,
  icon,
  size = "md",
  variant = "default",
  className = "",
  id,
  checked,
  ...props
}: SwitchProps) {
  const sizeClasses = {
    sm: {
      track: "h-5 w-9",
      thumb: "h-3.5 w-3.5",
      thumbChecked: "peer-checked:translate-x-4",
    },
    md: {
      track: "h-6 w-11",
      thumb: "h-4 w-4",
      thumbChecked: "peer-checked:translate-x-5",
    },
    lg: {
      track: "h-7 w-13",
      thumb: "h-5 w-5",
      thumbChecked: "peer-checked:translate-x-6",
    },
  };

  const sizes = sizeClasses[size];

  if (variant === "compact") {
    return (
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-center justify-between ${className}`}
      >
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div>
            {label && (
              <span className="block text-sm font-semibold text-foreground">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`${sizes.track} rounded-full border border-border bg-muted transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20`}
          />
          <div
            className={`${sizes.thumb} absolute left-1 top-1 rounded-full border border-border bg-background shadow-sm transition-transform ${sizes.thumbChecked}`}
          />
        </div>
      </label>
    );
  }

  return (
    <div className={`rounded-md border border-border bg-card p-4 ${className}`}>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div>
            {label && (
              <span className="block text-sm font-semibold text-foreground">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`${sizes.track} rounded-full border border-border bg-muted transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20`}
          />
          <div
            className={`${sizes.thumb} absolute left-1 top-1 rounded-full border border-border bg-background shadow-sm transition-transform ${sizes.thumbChecked}`}
          />
        </div>
      </label>
    </div>
  );
});

export default Switch;


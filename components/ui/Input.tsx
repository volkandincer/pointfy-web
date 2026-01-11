"use client";

import { memo, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(
    (
      {
        label,
        error,
        helperText,
        showPasswordToggle = false,
        showCharCount = false,
        maxLength,
        size = "md",
        fullWidth = true,
        type = "text",
        className = "",
        value,
        ...props
      },
      ref
    ) => {
      const [showPassword, setShowPassword] = useState(false);
      const isPassword = type === "password";
      const inputType = isPassword && showPasswordToggle && showPassword ? "text" : type;
      const currentLength = typeof value === "string" ? value.length : 0;

      const sizeClasses = {
        sm: "px-3 py-2 text-base min-h-[36px]",
        md: "px-4 py-2.5 text-base min-h-[44px]",
        lg: "px-5 py-3 text-base min-h-[52px]",
      };

      const labelSizeClasses = {
        sm: "px-1.5 text-xs",
        md: "px-2 text-xs",
        lg: "px-2 text-sm",
      };

      const baseClasses = `rounded-md border bg-background text-foreground outline-none transition-all focus:ring-2 ${
        fullWidth ? "w-full" : ""
      } ${sizeClasses[size]} ${label ? "pt-4" : ""}`;

      const stateClasses = error
        ? "border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/20 dark:bg-destructive/10"
        : "border-border bg-card focus:border-primary focus:ring-primary/20";

      return (
        <div className={fullWidth ? "w-full" : ""}>
          <div className="relative">
            {label && (
              <label
                htmlFor={props.id}
                className={`absolute top-0 -translate-y-1/2 bg-background text-sm font-semibold text-foreground transition-colors ${
                  error ? "text-destructive" : ""
                } ${labelSizeClasses[size]}`}
              >
                {label}
                {props.required && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </label>
            )}
            <input
              ref={ref}
              type={inputType}
              value={value}
              maxLength={maxLength}
              className={`${baseClasses} ${stateClasses} ${
                isPassword && showPasswordToggle ? "pr-10" : ""
              } ${className}`}
              {...props}
            />
            {isPassword && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {(error || helperText || showCharCount) && (
            <div className="mt-1.5 flex items-center justify-between">
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : helperText ? (
                <p className="text-xs text-muted-foreground">{helperText}</p>
              ) : (
                <span />
              )}
              {showCharCount && maxLength && (
                <p
                  className={`text-xs ${
                    currentLength > maxLength
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentLength}/{maxLength}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }
  )
);

Input.displayName = "Input";

const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
      {
        label,
        error,
        helperText,
        showCharCount = false,
        maxLength,
        size = "md",
        fullWidth = true,
        className = "",
        value,
        ...props
      },
      ref
    ) => {
      const currentLength = typeof value === "string" ? value.length : 0;

      const sizeClasses = {
        sm: "px-3 py-2 text-base min-h-[72px]",
        md: "px-4 py-2.5 text-base min-h-[88px]",
        lg: "px-5 py-3 text-base min-h-[104px]",
      };

      const labelSizeClasses = {
        sm: "px-1.5 text-xs left-3",
        md: "px-2 text-xs left-4",
        lg: "px-2 text-sm left-5",
      };

      const baseClasses = `rounded-md border bg-background text-foreground outline-none transition-all focus:ring-2 resize-none ${
        fullWidth ? "w-full" : ""
      } ${sizeClasses[size]} ${label ? "pt-4" : ""}`;

      const stateClasses = error
        ? "border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/20 dark:bg-destructive/10"
        : "border-border bg-card focus:border-primary focus:ring-primary/20";

      return (
        <div className={fullWidth ? "w-full" : ""}>
          <div className="relative">
            {label && (
              <label
                htmlFor={props.id}
                className={`absolute top-0 -translate-y-1/2 bg-background text-sm font-semibold text-foreground transition-colors ${
                  error ? "text-destructive" : ""
                } ${labelSizeClasses[size]}`}
              >
                {label}
                {props.required && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </label>
            )}
            <textarea
              ref={ref}
              value={value}
              maxLength={maxLength}
              className={`${baseClasses} ${stateClasses} ${className}`}
              {...props}
            />
          </div>
          {(error || helperText || showCharCount) && (
            <div className="mt-1.5 flex items-center justify-between">
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : helperText ? (
                <p className="text-xs text-muted-foreground">{helperText}</p>
              ) : (
                <span />
              )}
              {showCharCount && maxLength && (
                <p
                  className={`text-xs ${
                    currentLength > maxLength
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {currentLength}/{maxLength}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }
  )
);

Textarea.displayName = "Textarea";

export { Textarea };
export default Input;

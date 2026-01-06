"use client";

import { memo, useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import Button from "./Button";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Toast = memo(function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
  action,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getColors = () => {
    if (type === "success") {
      return {
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        icon: "text-green-600 dark:text-green-400",
        text: "text-green-900 dark:text-green-100",
        close: "text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50",
      };
    }
    if (type === "error") {
      return {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        icon: "text-red-600 dark:text-red-400",
        text: "text-red-900 dark:text-red-100",
        close: "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50",
      };
    }
    return {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      icon: "text-blue-600 dark:text-blue-400",
      text: "text-blue-900 dark:text-blue-100",
      close: "text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50",
    };
  };

  const colors = getColors();
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? XCircle : Info;

  return (
    <div
      className={`rounded-lg border ${colors.border} ${colors.bg} px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-2 opacity-0 scale-95"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${colors.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${colors.text}`}>{message}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => {
              onClose?.();
            }, 300);
          }}
          className={`shrink-0 rounded p-1 transition-colors ${colors.close}`}
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {action && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              action.onClick();
              setVisible(false);
              setTimeout(() => {
                onClose?.();
              }, 300);
            }}
            className={`!h-7 !px-3 !text-xs ${colors.border} ${colors.text} hover:${colors.bg}`}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
});

export default Toast;


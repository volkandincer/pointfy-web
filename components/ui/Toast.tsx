"use client";

import { memo, useEffect, useState } from "react";

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

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-blue-500";

  return (
    <div
      className={`rounded-lg ${bgColor} px-6 py-3 text-white shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          {type === "success" && <span className="text-lg">✓</span>}
          {type === "error" && <span className="text-lg">✕</span>}
          {type === "info" && <span className="text-lg">ℹ</span>}
          <p className="text-sm font-medium">{message}</p>
        </div>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              setVisible(false);
              setTimeout(() => {
                onClose?.();
              }, 300);
            }}
            className="rounded-md bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
});

export default Toast;


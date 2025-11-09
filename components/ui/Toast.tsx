"use client";

import { memo, useEffect, useState } from "react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
}

const Toast = memo(function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
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
      <div className="flex items-center gap-2">
        {type === "success" && <span className="text-lg">✓</span>}
        {type === "error" && <span className="text-lg">✕</span>}
        {type === "info" && <span className="text-lg">ℹ</span>}
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
});

export default Toast;


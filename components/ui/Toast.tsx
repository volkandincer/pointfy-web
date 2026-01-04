"use client";

import { memo, useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
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

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-blue-500";

  return (
    <div
      className={`rounded-md border-2 ${bgColor} px-6 py-3 text-white shadow-md transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          {type === "success" && <CheckCircle2 className="h-5 w-5 text-white" />}
          {type === "error" && <XCircle className="h-5 w-5 text-white" />}
          {type === "info" && <Info className="h-5 w-5 text-white" />}
          <p className="text-sm font-medium">{message}</p>
        </div>
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              action.onClick();
              setVisible(false);
              setTimeout(() => {
                onClose?.();
              }, 300);
            }}
            className="border-white/30 bg-white/20 text-white hover:bg-white/30"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
});

export default Toast;


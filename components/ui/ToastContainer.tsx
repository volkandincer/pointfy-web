"use client";

import { memo } from "react";
import Toast from "./Toast";
import type { ToastMessage } from "@/hooks/useToast";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const ToastContainer = memo(function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex flex-col-reverse gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => onRemove(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default ToastContainer;


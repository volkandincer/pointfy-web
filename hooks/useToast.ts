import { useState, useCallback } from "react";

export interface ToastMessage {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" = "success",
      duration: number = 3000
    ) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: ToastMessage = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}


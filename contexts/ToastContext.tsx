"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ToastMessage } from "@/hooks/useToast";

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (
    message: string,
    type?: "success" | "error" | "info",
    duration?: number,
    action?: {
      label: string;
      onClick: () => void;
    }
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" = "success",
      duration: number = 3000,
      action?: {
        label: string;
        onClick: () => void;
      }
    ) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: ToastMessage = { id, message, type, duration, action };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
}


"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
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

// Duplicate kontrolü için - son 2 saniye içinde aynı mesaj gösterilmişse tekrar gösterme
const RECENT_TOASTS = new Map<string, number>();
const DUPLICATE_THRESHOLD = 2000; // 2 saniye

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const recentToastsRef = useRef<Map<string, number>>(new Map());

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
      // Duplicate kontrolü - aynı mesaj kısa süre içinde tekrar gösterilmemeli
      const now = Date.now();
      const toastKey = `${message}-${type}`;
      const lastShown = recentToastsRef.current.get(toastKey);
      
      if (lastShown && now - lastShown < DUPLICATE_THRESHOLD) {
        return; // Duplicate toast'u göz ardı et
      }

      // Son gösterim zamanını kaydet
      recentToastsRef.current.set(toastKey, now);
      
      // Eski kayıtları temizle (5 saniye sonra)
      setTimeout(() => {
        recentToastsRef.current.delete(toastKey);
      }, 5000);

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


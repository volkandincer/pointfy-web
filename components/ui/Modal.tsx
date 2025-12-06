"use client";

import { memo, useEffect } from "react";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = memo(function Modal({
  open,
  title,
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-h-[90vh] overflow-y-auto border-t-2 border-gray-300 bg-white p-4 shadow-md sm:max-w-lg sm:rounded-lg sm:border-2 sm:border-gray-300 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
        {title && (
          <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
});

export default Modal;

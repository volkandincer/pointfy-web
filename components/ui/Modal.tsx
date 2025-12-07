"use client";

import { memo, useEffect } from "react";

interface ModalProps {
  open: boolean;
  title?: string | React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal = memo(function Modal({
  open,
  title,
  onClose,
  children,
  className = "",
}: ModalProps) {
  // Modal açıkken body scroll'unu disable et
  useEffect(() => {
    if (open) {
      // Scroll pozisyonunu kaydet
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Scroll pozisyonunu geri yükle
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      // Cleanup
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4"
      onTouchMove={(e) => {
        // Modal backdrop'unda scroll'u engelle
        const target = e.target as HTMLElement;
        if (target.classList.contains("fixed") || target.classList.contains("absolute")) {
          e.preventDefault();
        }
      }}
    >
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
        onTouchStart={(e) => {
          // Backdrop'a dokunulduğunda scroll'u engelle
          e.stopPropagation();
        }}
      />
      <div 
        className={`relative z-10 w-full max-h-[90vh] overflow-y-auto border-t-2 border-gray-300 bg-white p-4 shadow-md sm:max-w-lg sm:rounded-md sm:border-2 sm:border-gray-300 sm:p-6 dark:border-gray-700 dark:bg-gray-900 ${className}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          // Modal içindeki touch event'lerini sayfa scroll'undan ayır
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          // Modal içindeki scroll'u sayfa scroll'undan ayır
          e.stopPropagation();
        }}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {title && (
          <div className="mb-4 flex items-center justify-center gap-2 border-b-2 border-gray-200 pb-3 dark:border-gray-800 sm:mb-6 sm:gap-3 sm:pb-4">
            {typeof title === "string" ? (
              <h3 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg sm:text-xl">
                {title}
              </h3>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {title}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
});

export default Modal;

"use client";

import { memo, useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/utils/scrollLock";

interface MobileSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
  className?: string;
}

const MobileSelect = memo(function MobileSelect({
  value,
  onChange,
  options,
  label,
  className = "",
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında kapat ve body scroll lock
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      lockBodyScroll();
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    } else {
      unlockBodyScroll();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      // Cleanup body scroll lock - sadece açıkken cleanup yap
      if (isOpen) {
        unlockBodyScroll();
      }
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <label className="mb-2 block text-xs font-semibold text-card-foreground">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-md border-2 border-input bg-input px-3 py-3 text-base text-card-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 sm:py-2.5 sm:text-sm"
      >
        <div className="flex items-center justify-between">
          <span>{selectedOption.label}</span>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20"
            onClick={() => setIsOpen(false)}
            onTouchStart={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
          />
          {/* Dropdown Menu */}
          <div className="absolute z-[9999] mt-1 w-full rounded-md border-2 border-border bg-card shadow-md">
            <div 
              className="max-h-[60vh] overflow-y-auto overscroll-contain"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
              }}
              onTouchStart={(e) => {
                // Dropdown içindeki scroll'u sayfa scroll'undan ayır
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                // Dropdown içindeki scroll'u sayfa scroll'undan ayır
                e.stopPropagation();
              }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-base transition-colors touch-manipulation ${
                    value === option.value
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {value === option.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default MobileSelect;


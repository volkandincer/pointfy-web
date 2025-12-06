"use client";

import { memo, useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

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

  // Dışarı tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-3 text-base text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:py-2.5 sm:text-sm"
      >
        <div className="flex items-center justify-between">
          <span>{selectedOption.label}</span>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${
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
          <div className="absolute z-[9999] mt-1 w-full rounded-lg border-2 border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
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
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {value === option.value && (
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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


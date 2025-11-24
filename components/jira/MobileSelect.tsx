"use client";

import { memo, useState, useRef, useEffect } from "react";

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
        className="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-3 text-base text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:bg-gray-800 sm:py-2.5 sm:text-sm"
      >
        <div className="flex items-center justify-between">
          <span>{selectedOption.label}</span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
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
          <div className="absolute z-[9999] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
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
                      <svg
                        className="h-5 w-5 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
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


"use client";

import { memo, useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const FilterDropdown = memo(function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Seçiniz",
  className = "",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Body scroll'unu disable et (mobil için)
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
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
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      // Cleanup body scroll lock
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all active:border-blue-500 active:bg-gray-50 hover:border-blue-400 hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:active:border-blue-500 dark:active:bg-gray-700 dark:hover:border-blue-500 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {label}:
          </span>
          <span className={value === "all" ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}>
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onTouchStart={(e) => {
              // Backdrop'a dokunulduğunda scroll'u engelle
              e.preventDefault();
              setIsOpen(false);
            }}
          />
          <div 
            className="absolute z-20 mt-1 w-full rounded-md border-2 border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
            onTouchStart={(e) => {
              // Dropdown içindeki touch event'lerini sayfa scroll'undan ayır
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              // Dropdown içindeki scroll'u sayfa scroll'undan ayır
              e.stopPropagation();
            }}
          >
            <div 
              className="max-h-64 overflow-y-auto"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
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
                  className={`flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors active:bg-gray-100 dark:active:bg-gray-600 ${
                    value === option.value
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({option.count})
                      </span>
                    )}
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default FilterDropdown;


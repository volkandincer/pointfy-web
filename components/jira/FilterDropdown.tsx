"use client";

import { memo, useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/utils/scrollLock";

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

  return (
    <div className={`relative z-50 ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-md border-2 border-input bg-input px-4 py-3 text-sm font-medium text-card-foreground transition-all active:border-primary active:bg-accent hover:border-primary hover:bg-accent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {label}:
          </span>
          <span className={value === "all" ? "text-muted-foreground" : "text-card-foreground"}>
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[40]"
            onClick={() => setIsOpen(false)}
            onTouchStart={(e) => {
              // Backdrop'a dokunulduğunda scroll'u engelle
              e.preventDefault();
              setIsOpen(false);
            }}
          />
          <div 
            className="absolute z-[50] mt-1 w-full rounded-md border-2 border-border bg-card shadow-lg"
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
                  className={`flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors active:bg-accent ${
                    value === option.value
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({option.count})
                      </span>
                    )}
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-primary" />
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


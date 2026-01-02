"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SliderProps {
  children: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  transition?: "fade" | "slide";
  className?: string;
}

const Slider = memo(function Slider({
  children,
  autoPlay = true,
  interval = 4000,
  showDots = true,
  showArrows = true,
  transition = "fade",
  className = "",
}: SliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = children.length;

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (autoPlay && !isPaused && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoPlay, isPaused, interval, nextSlide, totalSlides]);

  if (totalSlides === 0) return null;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div className="relative overflow-hidden">
        <div
          className={`flex transition-all duration-500 ${
            transition === "slide" ? "transform" : ""
          }`}
          style={{
            transform:
              transition === "slide"
                ? `translateX(-${currentIndex * 100}%)`
                : undefined,
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className={`w-full flex-shrink-0 ${
                transition === "fade"
                  ? `transition-opacity duration-500 ${
                      index === currentIndex ? "opacity-100" : "opacity-0 absolute"
                    }`
                  : ""
              }`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Dots Navigation with Minimal Arrows */}
      {showDots && totalSlides > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {showArrows && (
            <button
              onClick={prevSlide}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 transition-all hover:text-primary hover:bg-primary/5 active:scale-95"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex gap-2">
            {children.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          {showArrows && (
            <button
              onClick={nextSlide}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 transition-all hover:text-primary hover:bg-primary/5 active:scale-95"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default Slider;


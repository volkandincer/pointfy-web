"use client";

import { memo } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { OnboardingModalProps } from "@/interfaces/Onboarding.interface";

const OnboardingModal = memo(function OnboardingModal({
  open,
  onClose,
  onComplete,
  currentStep,
  steps,
  onNext,
  onPrevious,
  onSkip,
  onOptionSelect,
}: OnboardingModalProps & { onOptionSelect?: (href: string) => void }) {
  const router = useRouter();
  
  if (!open) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isSelectionStep = step.isSelectionStep;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-[101] w-full max-w-lg rounded-md border-2 border-gray-300 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Adım {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-purple-600 transition-all duration-300 dark:bg-purple-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="mb-3">
          {!isSelectionStep ? (
            <div className="rounded-md border-l-4 border-purple-600 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start gap-3">
                {step.icon && (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20">
                    <step.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="mb-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                    {step.title}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mb-1.5 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                {step.title}
              </h2>
              <p className="mb-2 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                {step.description}
              </p>
            </>
          )}

          {/* Selection Options */}
          {isSelectionStep && step.options && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
              {step.options.map((option) => {
                const IconComponent = option.icon;
                const borderColorMap = {
                  blue: "border-l-blue-600 dark:border-l-blue-500",
                  purple: "border-l-purple-600 dark:border-l-purple-500",
                  green: "border-l-green-600 dark:border-l-green-500",
                  orange: "border-l-orange-600 dark:border-l-orange-500",
                  pink: "border-l-pink-600 dark:border-l-pink-500",
                };
                const iconColorMap = {
                  blue: "text-blue-600 dark:text-blue-400",
                  purple: "text-purple-600 dark:text-purple-400",
                  green: "text-green-600 dark:text-green-400",
                  orange: "text-orange-600 dark:text-orange-400",
                  pink: "text-pink-600 dark:text-pink-400",
                };
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (onOptionSelect) {
                        onOptionSelect(option.href);
                      } else {
                        router.push(option.href);
                        onComplete();
                      }
                    }}
                    className={`group relative flex min-h-[100px] flex-col items-center justify-center border-l-4 ${borderColorMap[option.color]} border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 text-center shadow-sm transition-all active:border-gray-400 active:shadow-md sm:min-h-[110px] hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900`}
                  >
                    <div className="mb-2">
                      <IconComponent className={`h-6 w-6 ${iconColorMap[option.color]} sm:h-7 sm:w-7`} />
                    </div>
                    <h3 className="mb-1 text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">
                      {option.title}
                    </h3>
                    <p className="hidden text-[10px] leading-tight text-gray-600 dark:text-gray-400 sm:block sm:text-xs">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isSelectionStep && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {!isFirstStep && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onPrevious}
                  icon={ChevronLeft}
                  className="!border-gray-300 !bg-white !text-gray-700 hover:!border-gray-400 hover:!bg-gray-50 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-gray-300"
                >
                  Geri
                </Button>
              )}
              {step.skipLabel && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSkip}
                  className="!border-gray-300 !bg-white !text-gray-600 hover:!border-gray-400 hover:!bg-gray-50 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-gray-400"
                >
                  {step.skipLabel}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isLastStep ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onComplete}
                  className="!border-purple-600 !bg-purple-600 hover:!border-purple-700 hover:!bg-purple-700 dark:!border-purple-500 dark:!bg-purple-600"
                >
                  Başlayalım!
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onNext}
                  icon={ChevronRight}
                  iconPosition="right"
                  className="!border-purple-600 !bg-purple-600 hover:!border-purple-700 hover:!bg-purple-700 dark:!border-purple-500 dark:!bg-purple-600"
                >
                  {step.actionLabel || "İleri"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default OnboardingModal;


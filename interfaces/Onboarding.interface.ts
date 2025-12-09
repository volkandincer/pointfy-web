export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  actionHref?: string;
  skipLabel?: string;
  isSelectionStep?: boolean;
  options?: OnboardingOption[];
}

export interface OnboardingOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: "blue" | "purple" | "green" | "orange" | "pink";
}

export interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentStep: number;
  steps: OnboardingStep[];
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}


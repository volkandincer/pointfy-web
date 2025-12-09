"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Users, 
  Link2, 
  Layout, 
  FileText,
  CheckCircle2,
  ClipboardList,
  StickyNote
} from "lucide-react";
import type { OnboardingStep, OnboardingOption } from "@/interfaces/Onboarding.interface";

const ONBOARDING_COOKIE_NAME = "pointfy_onboarding_completed";

export function useOnboarding(userId: string | null) {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user needs onboarding (only for logged-in users)
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Check cookie
    const onboardingCompleted = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${ONBOARDING_COOKIE_NAME}=`));

    if (!onboardingCompleted) {
      // Cookie yoksa onboarding göster
      setShowOnboarding(true);
    }

    setLoading(false);
  }, [userId]);

  // Onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Pointfy'ye Hoş Geldiniz! 🎉",
      description:
        "Pointfy, takım yönetimi ve planlama için tasarlanmış modern bir platformdur. Size en iyi deneyimi sunmak için kısa bir tur yapalım.",
      icon: Home,
    },
    {
      id: "rooms",
      title: "Takım Odaları",
      description:
        "Poker Planning ve Retrospektif için odalar oluşturun. Takımınızla birlikte görevleri oylayın ve planlama yapın.",
      icon: Users,
    },
    {
      id: "jira",
      title: "Jira Entegrasyonu",
      description:
        "Jira hesabınızı bağlayarak issue'larınızı yönetin, task'larınızı senkronize edin ve daha verimli çalışın.",
      icon: Link2,
    },
    {
      id: "boards",
      title: "Board'lar",
      description:
        "Kişisel board'larınızda task ve notlarınızı organize edin. Projelerinizi takip edin ve hedeflerinize ulaşın.",
      icon: Layout,
    },
    {
      id: "notes",
      title: "Notlar",
      description:
        "Hızlı notlar alın, fikirlerinizi kaydedin. Notlarınız her zaman elinizin altında olsun.",
      icon: FileText,
    },
    {
      id: "complete",
      title: "Hazırsınız! 🚀",
      description:
        "Artık Pointfy'yi kullanmaya başlayabilirsiniz. Aşağıdan başlamak istediğiniz özelliği seçebilirsiniz.",
      icon: CheckCircle2,
      isSelectionStep: true,
      options: [
        {
          id: "create-room",
          title: "Oda Oluştur",
          description: "Poker Planning veya Retrospektif için oda oluşturun",
          icon: Users,
          href: "/app/rooms/create",
          color: "blue",
        },
        {
          id: "jira",
          title: "Jira",
          description: "Jira hesabınızı bağlayın ve issue'larınızı yönetin",
          icon: Link2,
          href: "/app/jira",
          color: "purple",
        },
        {
          id: "boards",
          title: "Board'larım",
          description: "Task ve notlarınızı organize edin",
          icon: Layout,
          href: "/app/boards",
          color: "green",
        },
        {
          id: "tasks",
          title: "Tasklarım",
          description: "Kişisel tasklarınızı yönetin",
          icon: ClipboardList,
          href: "/app/tasks",
          color: "orange",
        },
        {
          id: "notes",
          title: "Notlarım",
          description: "Hızlı notlar alın ve fikirlerinizi kaydedin",
          icon: StickyNote,
          href: "/app/notes",
          color: "pink",
        },
      ] as OnboardingOption[],
    },
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleComplete = useCallback(() => {
    // Set cookie to mark onboarding as completed
    // Cookie expires in 1 year
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${ONBOARDING_COOKIE_NAME}=true; expires=${expires.toUTCString()}; path=/`;

    setShowOnboarding(false);
  }, []);

  const handleAction = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleOptionSelect = useCallback((href: string) => {
    router.push(href);
    handleComplete();
  }, [router, handleComplete]);

  return {
    showOnboarding,
    currentStep,
    steps,
    loading,
    onNext: handleAction,
    onPrevious: handlePrevious,
    onSkip: handleSkip,
    onComplete: handleComplete,
    onClose: handleComplete, // Close also marks as complete
    onOptionSelect: handleOptionSelect,
  };
}


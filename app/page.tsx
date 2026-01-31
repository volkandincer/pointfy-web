"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import QuickActions from "@/components/sections/QuickActions";
import Features from "@/components/sections/Features";
import CTA from "@/components/sections/CTA";
import HomeWelcome from "@/components/sections/HomeWelcome";
import GlobalNoteFab from "@/components/notes/GlobalNoteFab";
import ToastContainer from "@/components/ui/ToastContainer";
import { ToastProvider, useToastContext } from "@/contexts/ToastContext";
import { logger } from "@/lib/logger";
import type { Feature } from "@/interfaces/Feature.interface";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { QuickAction } from "@/interfaces/QuickAction.interface";
import { getDefaultNavigationItems } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";
import { forceUnlockBodyScroll } from "@/lib/utils/scrollLock";

function HomePageContent() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const { toasts, removeToast } = useToastContext();

  // Sayfa yüklendiğinde scroll lock'u temizle
  useEffect(() => {
    // Sayfa yüklendiğinde scroll lock'u zorla temizle
    forceUnlockBodyScroll();

    // Ayrıca body'nin scroll durumunu kontrol et ve düzelt
    if (document.body.style.position === "fixed") {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.removeAttribute("data-scroll-y");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function checkAuthAndJira() {
      try {
        const supabase = getSupabase();
        // Use getSession first for faster check
        const { data: sessionData } = await supabase.auth.getSession();
        if (!mounted) {
          setCheckingAuth(false);
          return;
        }

        if (sessionData.session?.user) {
          setUserId(sessionData.session.user.id);
        } else {
          setUserId(null);
        }
      } catch (error) {
        // Supabase bağlantı hatası veya env variable eksik
        logger.error("Auth check error:", error);
        if (mounted) {
          setUserId(null);
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuthAndJira();

    return () => {
      mounted = false;
    };
  }, []);

  const features: Feature[] = useMemo(
    () => [
      {
        id: "1",
        title: "Takım Odaları",
        description:
          "Takımınız için özel odalar oluşturun ve üyelerinizi organize edin.",
      },
      {
        id: "2",
        title: "Poker Planning",
        description:
          "Görevleri oylayarak daha iyi planlama yapın ve tahminlerinizi güçlendirin.",
      },
      {
        id: "3",
        title: "Retrospektif",
        description:
          "Takım performansınızı değerlendirin ve sürekli iyileştirme yapın.",
      },
      {
        id: "4",
        title: "Görev Yönetimi",
        description:
          "Not alın, görevler oluşturun ve takımınızla işbirliği yapın.",
      },
      {
        id: "5",
        title: "Gerçek Zamanlı Senkronizasyon",
        description:
          "Realtime ile anında güncellemeler alın ve değişiklikleri takip edin.",
      },
      {
        id: "6",
        title: "Kolay Kullanım",
        description:
          "Sezgisel arayüz ve modern tasarım ile takım yönetimi çok daha kolay.",
      },
    ],
    []
  );

  const actions: QuickAction[] = useMemo(
    () => [
      {
        id: "create-room",
        title: "Oda Oluştur",
        description: "Yeni bir oda oluşturun",
        href: "/app/rooms/create",
      },
      {
        id: "jira",
        title: "Jira",
        description: "Jira projelerinizi ve issue'larınızı yönetin",
        href: "/app/jira",
      },
      {
        id: "boards",
        title: "Board'larım",
        description: "Task ve notlarınızı organize edin",
        href: "/app/boards",
      },
      {
        id: "personal-tasks",
        title: "Tasklarım",
        description: "Kişisel tasklarınızı yönetin",
        href: "/app/tasks",
      },
      {
        id: "notes",
        title: "Notlarım",
        description: "Kişisel notlarınızı görüntüleyin",
        href: "/app/notes",
      },
      {
        id: "voted-tasks",
        title: "Puanladığım Task'lar",
        description: "Oy verdiğiniz task'ları görüntüleyin",
        href: "/app/voted-tasks",
      },
      {
        id: "retro",
        title: "Retro",
        description: "Takım retrosu başlat",
        href: "/app/rooms/create?type=retro",
      },
      {
        id: "account",
        title: "Hesabım",
        description: "Profil ve ayarlarınızı yönetin",
        href: "/app/account",
      },
    ],
    []
  );

  // Show loading state briefly to prevent flash
  if (checkingAuth) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <main>
          <div className="container mx-auto px-4 py-12">
            <div className="h-64 animate-pulse border-2 border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Header navigationItems={navigationItems} />
      <main className="pb-8">
        {userId ? <HomeWelcome /> : <Hero />}
        <QuickActions actions={actions} />
        {!userId && (
          <>
            <Features features={features} />
            <CTA />
          </>
        )}
      </main>
      {userId ? <GlobalNoteFab /> : null}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Footer navigationItems={navigationItems} />
    </div>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <HomePageContent />
    </ToastProvider>
  );
}

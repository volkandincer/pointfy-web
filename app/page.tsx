"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import QuickActions from "@/components/sections/QuickActions";
import Features from "@/components/sections/Features";
import CTA from "@/components/sections/CTA";
import RecentRooms from "@/components/sections/RecentRooms";
import HomeWelcome from "@/components/sections/HomeWelcome";
import GlobalNoteFab from "@/components/notes/GlobalNoteFab";
import ToastContainer from "@/components/ui/ToastContainer";
import { ToastProvider, useToastContext } from "@/contexts/ToastContext";
import type { Feature } from "@/interfaces/Feature.interface";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { QuickAction } from "@/interfaces/QuickAction.interface";
import { getDefaultNavigationItems } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";

function HomePageContent() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const { toasts, removeToast } = useToastContext();

  useEffect(() => {
    let mounted = true;
    async function checkAuthAndJira() {
      try {
        const supabase = getSupabase();
        // Use getSession first for faster check
        const { data: sessionData } = await supabase.auth.getSession();
        if (!mounted) return;

        if (sessionData.session?.user) {
          setUserId(sessionData.session.user.id);
          // Get username and Jira connection status
          const { data: userRow } = await supabase
            .from("users")
            .select("username, jira_access_token")
            .eq("id", sessionData.session.user.id)
            .single();
          if (!mounted) return;
          setJiraConnected(!!userRow?.jira_access_token);
        } else {
          setUserId(null);
          setJiraConnected(false);
        }
      } catch {
        if (!mounted) return;
        setUserId(null);
        setJiraConnected(false);
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    }

    checkAuthAndJira();

    // Jira OAuth callback'ten döndükten sonra durumu kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("jira_connected") === "true") {
      // OAuth callback'ten döndük, durumu yeniden kontrol et
      setTimeout(() => {
        checkAuthAndJira();
      }, 1000);
    }

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
        icon: "⚡",
      },
      {
        id: "boards",
        title: "Board'larım",
        description: "Task ve notlarınızı organize edin",
        href: "/app/boards",
        icon: "📋",
      },
      {
        id: "personal-tasks",
        title: "Tasklarım",
        description: "Kişisel tasklarınızı yönetin",
        href: "/app/tasks",
        icon: "📝",
      },
      {
        id: "notes",
        title: "Notlarım",
        description: "Kişisel notlarınızı görüntüleyin",
        href: "/app/notes",
        icon: "✏️",
      },
      {
        id: "voted-tasks",
        title: "Puanladığım Task'lar",
        description: "Oy verdiğiniz task'ları görüntüleyin",
        href: "/app/voted-tasks",
        icon: "📊",
      },
      {
        id: "retro",
        title: "Retro",
        description: "Takım retrosu başlat",
        href: "/app/rooms/create?type=retro",
        icon: "🔁",
      },
      {
        id: "jira",
        title: jiraConnected ? "Jira" : "Jira'yı Bağla",
        description: jiraConnected
          ? "Jira projelerinizi ve issue&apos;larınızı görüntüleyin"
          : "Jira hesabınızı bağlayın ve projelerinizi yönetin",
        href: jiraConnected ? "/app/jira" : "#",
        icon: "🔗",
        onClick: jiraConnected
          ? undefined
          : async () => {
              if (!userId) return;
              try {
                const returnUrl = encodeURIComponent("/");
                const encodedUserId = encodeURIComponent(userId);
                window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
              } catch (err) {
                console.error("Jira OAuth error:", err);
              }
            },
      },
    ],
    [jiraConnected, userId]
  );

  // Show loading state briefly to prevent flash
  if (checkingAuth) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <main>
          <div className="container mx-auto px-4 py-12">
            <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main>
        {userId ? <HomeWelcome /> : <Hero />}
        <QuickActions actions={actions} />
        <RecentRooms />
        <Features features={features} />
        <CTA />
      </main>
      {userId ? <GlobalNoteFab /> : null}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Footer navigationItems={navigationItems} />
    </>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <HomePageContent />
    </ToastProvider>
  );
}

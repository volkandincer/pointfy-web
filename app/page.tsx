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
import type { Feature } from "@/interfaces/Feature.interface";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { QuickAction } from "@/interfaces/QuickAction.interface";
import { getDefaultNavigationItems } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";

export default function HomePage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        if (data.user) {
          setUserId(data.user.id);
          const { data: userRow } = await supabase
            .from("users")
            .select("username")
            .eq("key", data.user.id)
            .single();
          if (!mounted) return;
          setUsername(userRow?.username);
        } else {
          setUserId(null);
        }
      } catch {
        if (!mounted) return;
        setUserId(null);
      }
    })();
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
          "Supabase Realtime ile anında güncellemeler alın ve değişiklikleri takip edin.",
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
        href: "/app/rooms",
        icon: "⚡",
      },
      {
        id: "personal-tasks",
        title: "Tasklarım",
        description: "Kişisel tasklarınızı yönetin",
        href: "/app/rooms",
        icon: "📝",
      },
      {
        id: "notes",
        title: "Notlarım",
        description: "Kişisel notlarınızı görüntüleyin",
        href: "/app/rooms",
        icon: "✏️",
      },
      {
        id: "retro",
        title: "Retro",
        description: "Takım retrosu başlat",
        href: "/app/rooms",
        icon: "🔁",
      },
    ],
    []
  );

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main>
        {userId ? <HomeWelcome username={username} /> : <Hero />}
        <QuickActions actions={actions} />
        <RecentRooms createdByKey={userId ?? undefined} />
        <Features features={features} />
        <CTA />
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

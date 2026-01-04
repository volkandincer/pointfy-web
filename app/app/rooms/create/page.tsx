"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DoorOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import CreateRoomForm from "@/components/rooms/CreateRoomForm";
import { useToastContext } from "@/contexts/ToastContext";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type {
  RoomCreateInput,
  RoomType,
} from "@/interfaces/RoomCreate.interface";
import { getSupabase } from "@/lib/supabase";

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function CreateRoomPageContent() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const router = useRouter();
  const { showToast } = useToastContext();
  const searchParams = useSearchParams();
  const roomTypeFromQuery = searchParams.get("type") as RoomType | null;
  const [loading, setLoading] = useState<boolean>(false);
  const [userKey, setUserKey] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        if (!data.user) {
          const returnUrl = encodeURIComponent("/app/rooms/create");
          router.replace(`/login?returnUrl=${returnUrl}`);
          return;
        }
        setUserKey(data.user.id);
        const { data: userRow } = await supabase
          .from("users")
          .select("username")
          .eq("id", data.user.id)
          .single();
        if (!mounted) return;
        setUsername(
          userRow?.username || data.user.email?.split("@")[0] || "User"
        );
      } catch {
        if (mounted) {
          const returnUrl = encodeURIComponent("/app/rooms/create");
          router.replace(`/login?returnUrl=${returnUrl}`);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleCreate = useCallback(
    async (input: RoomCreateInput) => {
      if (!userKey || !username) return;
      setLoading(true);
      try {
        const supabase = getSupabase();
        const roomCode = generateRoomCode();

        // Odayı oluştur
        const { data: roomData, error } = await supabase
          .from("rooms")
          .insert({
            code: roomCode,
            name: input.name,
            description: input.description || null,
            room_type: input.roomType,
            created_by_key: userKey,
            created_by_username: username,
            is_private: input.settings.isPrivate,
            room_password: input.settings.isPrivate
              ? input.settings.roomPassword
              : null,
            max_participants: input.settings.maxParticipants,
            allow_spectators: input.settings.allowSpectators,
            auto_reveal: input.settings.autoReveal,
            is_active: true,
            status: "active",
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) throw error;
        if (!roomData) throw new Error("Oda oluşturuldu ama ID alınamadı");

        // Kullanıcıyı odaya admin olarak ekle
        const { error: participantError } = await supabase
          .from("room_participants")
          .insert({
            room_code: roomCode,
            user_key: userKey,
            username: username,
            is_admin: true,
            joined_at: new Date().toISOString(),
          });

        if (participantError) throw participantError;

        // Odaya yönlendir
        router.replace(`/app/rooms/${roomData.id}`);
      } catch (err: unknown) {
        showToast((err as Error).message || "Oda oluşturulamadı.", "error");
      } finally {
        setLoading(false);
      }
    },
    [userKey, username, router, showToast]
  );

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-2xl">
            <PageHeader
              title="Yeni Oda Oluştur"
              description="Takımınızla birlikte çalışmak için bir oda oluşturun"
              icon={DoorOpen}
              iconColor="blue"
              className="mb-8"
            />
            <div>
              <CreateRoomForm
                onSubmit={handleCreate}
                loading={loading}
                initialRoomType={roomTypeFromQuery || undefined}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={
      <>
        <Header navigationItems={getDefaultNavigationItems()} />
        <main className="container mx-auto px-4 py-16">
          <div className="h-40 animate-pulse border-2 border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
        </main>
        <Footer navigationItems={getDefaultNavigationItems()} />
      </>
    }>
      <CreateRoomPageContent />
    </Suspense>
  );
}

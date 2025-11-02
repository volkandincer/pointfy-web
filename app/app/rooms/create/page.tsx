"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CreateRoomForm from "@/components/rooms/CreateRoomForm";
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

export default function CreateRoomPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const router = useRouter();
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
          .eq("key", data.user.id)
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
        console.error("CreateRoomPage: Oda oluşturma hatası:", err);
        alert((err as Error).message || "Oda oluşturulamadı.");
      } finally {
        setLoading(false);
      }
    },
    [userKey, username, router]
  );

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Yeni Oda
            </h1>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Takımınızla birlikte çalışmak için bir oda oluşturun
            </p>
            <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
              <CreateRoomForm
                onSubmit={handleCreate}
                loading={loading}
                initialRoomType={roomTypeFromQuery || undefined}
              />
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";

interface UseRoomAdminResult {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  permissions: {
    is_admin: boolean;
    is_spectator: boolean;
    can_vote: boolean;
    can_create_tasks: boolean;
    can_manage_room: boolean;
  } | null;
}

export function useRoomAdmin(
  roomCode: string,
  userKey: string
): UseRoomAdminResult {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] =
    useState<UseRoomAdminResult["permissions"]>(null);

  useEffect(() => {
    if (!roomCode || !userKey) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function checkAdminStatus() {
      try {
        setLoading(true);
        setError(null);

        const supabase = getSupabase();

        // Önce room_participants tablosundan kontrol et
        const { data: participantData, error: participantError } =
          await supabase
            .from("room_participants")
            .select("is_admin")
            .eq("room_code", roomCode)
            .eq("user_key", userKey)
            .single();

        if (!mounted) return;

        // Eğer participant bulunamazsa, room'un created_by_key'ini kontrol et
        if (participantError || !participantData) {
          const { data: roomData, error: roomError } = await supabase
            .from("rooms")
            .select("created_by_key")
            .eq("code", roomCode)
            .single();

          if (!mounted) return;

          if (roomError || !roomData) {
            setIsAdmin(false);
            setLoading(false);
            return;
          }

          const adminStatus = roomData.created_by_key === userKey;
          setIsAdmin(adminStatus);

          // Basit permissions objesi oluştur
          setPermissions({
            is_admin: adminStatus,
            is_spectator: false,
            can_vote: !adminStatus, // Admin puanlama yapamaz
            can_create_tasks: adminStatus,
            can_manage_room: adminStatus,
          });

          setLoading(false);
          return;
        }

        // Participant bulundu, is_admin değerini kullan
        const adminStatus = participantData.is_admin || false;

        // Ayrıca room'un created_by_key'ini de kontrol et (ekstra güvenlik)
        const { data: roomData } = await supabase
          .from("rooms")
          .select("created_by_key")
          .eq("code", roomCode)
          .single();

        if (!mounted) return;

        // Eğer room'un creator'ı ise, admin olarak kabul et
        const finalAdminStatus =
          adminStatus || roomData?.created_by_key === userKey;

        setIsAdmin(finalAdminStatus);

        // Permissions objesi oluştur
        setPermissions({
          is_admin: finalAdminStatus,
          is_spectator: false,
          can_vote: !finalAdminStatus, // Admin puanlama yapamaz
          can_create_tasks: finalAdminStatus,
          can_manage_room: finalAdminStatus,
        });
      } catch (err) {
        if (!mounted) return;
        console.error("Admin kontrolü exception:", err);
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkAdminStatus();

    return () => {
      mounted = false;
    };
  }, [roomCode, userKey]);

  return {
    isAdmin,
    loading,
    error,
    permissions,
  };
}


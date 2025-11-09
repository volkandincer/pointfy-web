"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AllRoomsModal from "@/components/rooms/AllRoomsModal";
import RoomPinModal from "@/components/rooms/RoomPinModal";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";
import {
  checkRoomEntry,
  verifyRoomPin,
  addUserToRoom,
} from "@/lib/roomUtils";

const RecentRooms = memo(function RecentRooms() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomInfo[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAllRoomsModal, setShowAllRoomsModal] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [userKey, setUserKey] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function fetchRooms() {
      try {
        const supabase = getSupabase();
        
        // Kullanıcı bilgilerini al
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          setUserKey(userData.user.id);
          const { data: userRow } = await supabase
            .from("users")
            .select("username")
            .eq("key", userData.user.id)
            .single();
          if (userRow?.username) {
            setUsername(userRow.username);
          } else {
            setUsername(userData.user.email?.split("@")[0] || "User");
          }
        }

        // Mobil projede olduğu gibi: sadece aktif odaları göster, tüm odaları göster (createdByKey filtresi yok)
        const { data } = await supabase
          .from("rooms")
          .select("id, name, code, created_by_username, is_active, created_at")
          .eq("is_active", true)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(8);
        if (!mounted) return;
        setRooms(data || []);
      } catch {
        if (!mounted) return;
        setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRooms();
    return () => {
      mounted = false;
    };
  }, []);

  // İlk 3 odayı göster (mobil projede olduğu gibi)
  const displayedRooms = rooms ? rooms.slice(0, 3) : [];
  const hasMoreRooms = rooms ? rooms.length > 3 : false;

  const handleRoomClick = async (roomId: string) => {
    try {
      const result = await checkRoomEntry(roomId);
      
      if (result.error) {
        alert(result.error);
        return;
      }

      if (result.needsPin && result.room) {
        // PIN gerekli
        setSelectedRoom({
          id: result.room.id,
          code: result.room.code,
        });
        setShowPinModal(true);
        return;
      }

      // Şifresiz oda - direkt giriş yap
      if (result.room && userKey && username) {
        await addUserToRoom(result.room.code, userKey, username);
      }
      router.push(`/app/rooms/${roomId}`);
    } catch (err) {
      console.error("Room entry error:", err);
      alert("Odaya giriş yapılırken bir hata oluştu.");
    }
  };

  const handlePinSubmit = async (pin: string) => {
    if (!selectedRoom) return;

    setPinLoading(true);
    setPinError(null);

    try {
      const result = await verifyRoomPin(selectedRoom.id, pin);

      if (!result.success) {
        setPinError(result.error || "PIN yanlış!");
        setPinLoading(false);
        return;
      }

      // PIN doğru - kullanıcıyı odaya ekle
      if (userKey && username) {
        await addUserToRoom(selectedRoom.code, userKey, username);
      }

      setShowPinModal(false);
      setSelectedRoom(null);
      router.push(`/app/rooms/${selectedRoom.id}`);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
          Son Aktif Odalar
        </h2>
        {loading ? (
          <div className="space-y-3.5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : displayedRooms.length > 0 ? (
          <>
            <div className="space-y-3.5">
              {displayedRooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRoomClick(r.id)}
                  className="group relative w-full flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-l-4 border-l-blue-600 border-blue-400/15 bg-white p-5 text-left shadow-[0_6px_16px_rgba(59,130,246,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)] dark:border-blue-500/10 dark:bg-gray-900 dark:border-l-blue-500"
                >
                  {/* Icon Container */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50/80 text-2xl shadow-[0_4px_8px_rgba(59,130,246,0.1)] dark:bg-blue-900/20">
                    🏠
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1.5 truncate text-lg font-bold text-gray-900 dark:text-white">
                      {r.name || "Oda"}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {r.code}
                      </span>
                      {r.created_by_username && (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {r.created_by_username}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition group-hover:scale-110">
                    <span className="text-lg font-bold">→</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Tüm Odaları Gör Butonu */}
            {hasMoreRooms && (
              <button
                onClick={() => setShowAllRoomsModal(true)}
                className="group mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-blue-400/20 bg-white p-5 shadow-[0_6px_16px_rgba(59,130,246,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.15)] dark:border-blue-500/20 dark:bg-gray-900"
              >
                <span className="text-2xl">📋</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tüm odaları gör
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {(rooms?.length || 0) - 3}
                </div>
              </button>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-gray-200/70 bg-white p-8 text-center dark:border-gray-800/70 dark:bg-gray-900">
            <p className="mb-2 text-4xl">🏠</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Henüz oda yok
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              İlk odanızı oluşturun
            </p>
          </div>
        )}
      </div>
      <AllRoomsModal
        open={showAllRoomsModal}
        onClose={() => setShowAllRoomsModal(false)}
      />
      <RoomPinModal
        open={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setSelectedRoom(null);
          setPinError(null);
        }}
        onSubmit={handlePinSubmit}
        loading={pinLoading}
        error={pinError}
      />
    </section>
  );
});

export default RecentRooms;

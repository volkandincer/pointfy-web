"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ClipboardList, ChevronRight } from "lucide-react";
import AllRoomsModal from "@/components/rooms/AllRoomsModal";
import RoomPinModal from "@/components/rooms/RoomPinModal";
import EmptyState from "@/components/jira/EmptyState";
import { useToastContext } from "@/contexts/ToastContext";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";
import {
  checkRoomEntry,
  verifyRoomPin,
  addUserToRoom,
} from "@/lib/roomUtils";

const RecentRooms = memo(function RecentRooms() {
  const router = useRouter();
  const { showToast } = useToastContext();
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
            .eq("id", userData.user.id)
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
        showToast(result.error, "error");
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
      showToast("Odaya giriş yapılırken bir hata oluştu.", "error");
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
        <div className="mb-5">
          <h2 className="mb-0.5 text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl md:text-2xl">
            Son Aktif Odalar
          </h2>
        </div>
        {loading ? (
          <div className="space-y-3.5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 animate-pulse border-2 border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
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
                  className="group relative w-full flex items-center gap-4 border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-5 text-left shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                  style={{
                    borderLeftColor: '#2563eb',
                  }}
                >
                  {/* Icon Container */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20">
                    <Home className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1.5 truncate text-lg font-bold text-gray-900 dark:text-white">
                      {r.name || "Oda"}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg border-2 border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-blue-600 bg-blue-600 text-white transition-colors group-hover:bg-blue-700 group-hover:border-blue-700">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </button>
              ))}
            </div>

            {/* Tüm Odaları Gör Butonu */}
            {hasMoreRooms && (
              <button
                onClick={() => setShowAllRoomsModal(true)}
                className="group mt-4 w-full flex items-center justify-center gap-2 border-2 border-blue-600 bg-white p-5 shadow-sm transition-all hover:border-blue-700 hover:shadow-md hover:bg-blue-50 dark:border-blue-500 dark:bg-gray-900 dark:hover:bg-blue-900/20"
              >
                <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tüm odaları gör
                </span>
                <div className="flex h-6 w-6 items-center justify-center border-2 border-blue-600 bg-blue-600 text-xs font-bold text-white dark:border-blue-500 dark:bg-blue-500">
                  {(rooms?.length || 0) - 3}
                </div>
              </button>
            )}
          </>
        ) : (
          <EmptyState
            icon={Home}
            title="Henüz oda yok"
            description="İlk odanızı oluşturun"
          />
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

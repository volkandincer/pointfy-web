"use client";

import { memo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RoomPinModal from "@/components/rooms/RoomPinModal";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";
import {
  checkRoomEntry,
  verifyRoomPin,
  addUserToRoom,
} from "@/lib/roomUtils";

const HomeWelcome = memo(function HomeWelcome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [userKey, setUserKey] = useState<string>("");
  const [usernameState, setUsernameState] = useState<string>("");

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          setUserKey(userData.user.id);
          const { data: userRow } = await supabase
            .from("users")
            .select("username")
            .eq("key", userData.user.id)
            .single();
          if (userRow?.username) {
            setUsernameState(userRow.username);
          } else {
            setUsernameState(userData.user.email?.split("@")[0] || "User");
          }
        }
      } catch {
        // Ignore
      }
    }
    fetchUserInfo();
    return () => {
      mounted = false;
    };
  }, []);

  // Arama yapıldığında odaları getir
  useEffect(() => {
    if (!searchQuery.trim()) {
      setRooms([]);
      setShowResults(false);
      return;
    }

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    async function searchRooms() {
      setLoading(true);
      try {
        // Kısa bir debounce
        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 300);
        });

        if (!mounted) return;

        const supabase = getSupabase();
        const query = searchQuery.toLowerCase().trim();
        
        const { data, error } = await supabase
          .from("rooms")
          .select("id, name, code, created_by_username, is_active, created_at")
          .eq("is_active", true)
          .eq("status", "active")
          .or(`name.ilike.%${query}%,code.ilike.%${query}%,created_by_username.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!mounted) return;

        if (error) {
          console.error("Search error:", error);
          setRooms([]);
        } else {
          setRooms(data || []);
          setShowResults(true);
        }
      } catch (err) {
        console.error("Search exception:", err);
        if (mounted) setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    searchRooms();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchQuery]);

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
      if (result.room && userKey && usernameState) {
        await addUserToRoom(result.room.code, userKey, usernameState);
      }
      setSearchQuery("");
      setShowResults(false);
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
      if (userKey && usernameState) {
        await addUserToRoom(selectedRoom.code, userKey, usernameState);
      }

      setShowPinModal(false);
      setSelectedRoom(null);
      setSearchQuery("");
      setShowResults(false);
      router.push(`/app/rooms/${selectedRoom.id}`);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <>
      <section className="container mx-auto px-4 pt-8 pb-4">
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            {/* Arama Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (rooms.length > 0) setShowResults(true);
                }}
                placeholder="Oda ara (ad, kod veya oluşturan)..."
                className="w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 pl-12 pr-12 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowResults(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Arama Sonuçları */}
            {showResults && searchQuery && (
              <div className="absolute z-50 mt-2 w-full rounded-2xl border-2 border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                {loading ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aranıyor...
                    </p>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="mb-2 text-2xl">🔍</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      &quot;{searchQuery}&quot; için oda bulunamadı
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleRoomClick(room.id)}
                        className="group w-full rounded-xl border border-gray-200/70 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-400/50 hover:bg-blue-50/50 hover:shadow-md dark:border-gray-800/70 dark:bg-gray-900 dark:hover:border-blue-500/50 dark:hover:bg-blue-900/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 text-xl shadow-sm dark:bg-blue-900/20">
                            🏠
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 truncate text-base font-semibold text-gray-900 dark:text-white">
                              {room.name || "Oda"}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {room.code}
                              </span>
                              {room.created_by_username && (
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                  {room.created_by_username}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition group-hover:scale-110">
                            <span className="text-sm font-bold">→</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Click outside to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}

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
    </>
  );
});

export default HomeWelcome;

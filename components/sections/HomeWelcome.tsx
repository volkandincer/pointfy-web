"use client";

import { memo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Home, ChevronRight } from "lucide-react";
import RoomPinModal from "@/components/rooms/RoomPinModal";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import { useToastContext } from "@/contexts/ToastContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";
import { checkRoomEntry, verifyRoomPin, addUserToRoom } from "@/lib/roomUtils";

const HomeWelcome = memo(function HomeWelcome() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [userId, setUserId] = useState<string | null>(null);
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
    let mounted = true;
    async function fetchUserInfo() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted) return;
        if (userData.user) {
          setUserId(userData.user.id);
          setUserKey(userData.user.id);
          const { data: userRow } = await supabase
            .from("users")
            .select("username")
            .eq("id", userData.user.id)
            .single();
          if (!mounted) return;
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

  // Onboarding hook
  const onboarding = useOnboarding(userId);

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
          .select(
            "id, name, code, created_by_username, is_active, created_at, room_type"
          )
          .eq("is_active", true)
          .eq("status", "active")
          .or(
            `name.ilike.%${query}%,code.ilike.%${query}%,created_by_username.ilike.%${query}%`
          )
          .order("created_at", { ascending: false })
          .limit(10);

        if (!mounted) return;

        if (error) {
          // Search error
          setRooms([]);
        } else {
          setRooms(data || []);
          setShowResults(true);
        }
      } catch {
        // Search exception
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
      if (result.room && userKey && usernameState) {
        await addUserToRoom(result.room.code, userKey, usernameState);
      }
      setSearchQuery("");
      setShowResults(false);
      router.push(`/app/rooms/${roomId}`);
    } catch {
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
      {/* Onboarding Modal */}
      {onboarding.showOnboarding && (
        <OnboardingModal
          open={onboarding.showOnboarding}
          onClose={onboarding.onClose}
          onComplete={onboarding.onComplete}
          currentStep={onboarding.currentStep}
          steps={onboarding.steps}
          onNext={onboarding.onNext}
          onPrevious={onboarding.onPrevious}
          onSkip={onboarding.onSkip}
          onOptionSelect={onboarding.onOptionSelect}
        />
      )}

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
                className="w-full rounded-md border-2 border-gray-300 bg-white px-5 py-4 pl-12 pr-12 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowResults(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Arama Sonuçları */}
            {showResults && searchQuery && (
              <div className="absolute z-50 mt-2 w-full rounded-md border-2 border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
                {loading ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aranıyor...
                    </p>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="p-6 text-center">
                    <Search className="mx-auto mb-2 h-8 w-8 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      &quot;{searchQuery}&quot; için oda bulunamadı
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {rooms.map((room) => {
                      const isRetro = room.room_type === "retro";
                      const borderColor = isRetro
                        ? "border-l-purple-600 dark:border-l-purple-500"
                        : "border-l-blue-600 dark:border-l-blue-500";
                      const iconBorderColor = isRetro
                        ? "border-purple-600 dark:border-purple-500"
                        : "border-blue-600 dark:border-blue-500";
                      const iconBgColor = isRetro
                        ? "bg-purple-50 dark:bg-purple-900/20"
                        : "bg-blue-50 dark:bg-blue-900/20";
                      const iconTextColor = isRetro
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-blue-600 dark:text-blue-400";
                      const arrowBorderColor = isRetro
                        ? "border-purple-600 bg-purple-600 group-hover:bg-purple-700 group-hover:border-purple-700"
                        : "border-blue-600 bg-blue-600 group-hover:bg-blue-700 group-hover:border-blue-700";

                      return (
                        <button
                          key={room.id}
                          onClick={() => handleRoomClick(room.id)}
                          className={`group w-full border-l-4 ${borderColor} border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 text-left shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 ${iconBorderColor} ${iconBgColor}`}
                            >
                              <Home className={`h-6 w-6 ${iconTextColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="mb-1 truncate text-base font-semibold text-gray-900 dark:text-white">
                                {room.name || "Oda"}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="rounded-md border-2 border-gray-300 bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                  {room.code}
                                </span>
                                {room.created_by_username && (
                                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    {room.created_by_username}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 ${arrowBorderColor} text-white shadow-sm transition`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
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
          onTouchStart={(e) => {
            // Backdrop'a dokunulduğunda scroll'u engelle
            e.preventDefault();
            setShowResults(false);
          }}
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

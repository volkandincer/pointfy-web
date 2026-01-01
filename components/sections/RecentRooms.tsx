"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ClipboardList } from "lucide-react";
import Button from "@/components/ui/Button";
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

        const { data } = await supabase
          .from("rooms")
          .select("id, name, code, created_by_username, is_active, created_at, room_type")
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

  const displayedRooms = rooms ? rooms.slice(0, 4) : [];
  const hasMoreRooms = rooms ? rooms.length > 4 : false;

  const handleRoomClick = async (roomId: string) => {
    try {
      const result = await checkRoomEntry(roomId);
      
      if (result.error) {
        showToast(result.error, "error");
        return;
      }

      if (result.needsPin && result.room) {
        setSelectedRoom({
          id: result.room.id,
          code: result.room.code,
        });
        setShowPinModal(true);
        return;
      }

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
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <h2 className="mb-0.5 text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
            Son Aktif Odalar
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Aktif odalara hızlıca erişin
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 animate-pulse border-l-4 border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-card p-3 shadow-sm sm:h-28 sm:p-4"
              />
            ))}
          </div>
        ) : displayedRooms.length > 0 ? (
          <>
            {/* Room Cards Grid - Same design language as QuickActions */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
              {displayedRooms.map((r) => {
                const isRetro = r.room_type === "retro";
                const borderColor = isRetro 
                  ? "border-l-purple-600 dark:border-l-purple-500" 
                  : "border-l-blue-600 dark:border-l-blue-500";
                const iconColor = isRetro
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-blue-600 dark:text-blue-400";
                
                return (
                <button
                  key={r.id}
                  onClick={() => handleRoomClick(r.id)}
                  className={`group relative flex min-h-[100px] flex-col items-center justify-center border-l-4 ${borderColor} border-t-2 border-r-2 border-b-2 border-border bg-card p-3 text-center shadow-sm transition-all active:border-border active:shadow-md sm:min-h-[120px] sm:p-4 hover:border-border hover:shadow-md`}
                >
                  {/* Icon */}
                  <div className="mb-2 sm:mb-2.5">
                    <Home className={`h-6 w-6 ${iconColor} sm:h-7 sm:w-7`} />
                  </div>

                  {/* Room Name */}
                  <h3 className="mb-1 truncate w-full text-xs font-semibold text-card-foreground sm:text-sm">
                    {r.name || "Oda"}
                  </h3>

                  {/* Room Code and Username */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="rounded-md border-2 border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
                      {r.code}
                    </span>
                    {r.created_by_username && (
                      <span className="hidden text-[10px] font-semibold text-green-500 sm:block sm:text-xs">
                        {r.created_by_username}
                      </span>
                    )}
                  </div>
                </button>
                );
              })}
            </div>

            {/* View All Button */}
            {hasMoreRooms && (
              <div className="mt-4">
                <button
                  onClick={() => setShowAllRoomsModal(true)}
                  className="group flex w-full items-center justify-center gap-3 rounded-md border-2 border-primary bg-card px-4 py-3 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-md"
                >
                  <ClipboardList className="h-5 w-5" />
                  <span>Tüm odaları gör</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-primary bg-primary text-xs font-bold text-primary-foreground">
                    {(rooms?.length || 0) - 4}
                  </span>
                </button>
              </div>
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

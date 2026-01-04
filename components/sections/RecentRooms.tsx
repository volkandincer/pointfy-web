"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ClipboardList, Users, RefreshCw, Calendar, Lock, ArrowRight } from "lucide-react";
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
          .select("id, name, code, created_by_username, is_active, created_at, room_type, is_private")
          .eq("is_active", true)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(20);
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

  const displayedRooms = rooms || [];
  const hasMoreRooms = displayedRooms.length > 20;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

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

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse border-l-4 border-l-primary border-t border-r border-b border-border bg-card p-6 shadow-sm"
              />
            ))}
          </div>
        ) : displayedRooms.length > 0 ? (
          <>
            {/* Rooms List */}
            <div className="space-y-4">
              {displayedRooms.map((r) => {
                const isRetro = r.room_type === "retro";
                const borderColor = isRetro 
                  ? "border-l-purple-600 dark:border-l-purple-500" 
                  : "border-l-blue-600 dark:border-l-blue-500";
                const iconGradient = isRetro
                  ? "from-purple-500 to-purple-600"
                  : "from-blue-500 to-blue-600";
                const badgeBg = isRetro
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
                const RoomIcon = isRetro ? RefreshCw : Users;
                
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRoomClick(r.id)}
                    className={`group relative flex w-full items-center gap-4 border-l-4 ${borderColor} border-t border-r border-b border-border bg-card p-4 text-left shadow-sm transition-all hover:border-border hover:shadow-md sm:gap-5 sm:p-5`}
                  >
                    {/* Icon with Gradient Background */}
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 ${borderColor} bg-gradient-to-br ${iconGradient} shadow-md transition-transform group-hover:scale-105 sm:h-14 sm:w-14`}>
                      <RoomIcon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-2 min-w-0">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-card-foreground sm:text-lg">
                              {r.name || "İsimsiz Oda"}
                            </h3>
                            {r.is_private && (
                              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
                            <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground sm:px-2.5 sm:py-1 sm:text-sm">
                              {r.code}
                            </span>
                            <div className={`rounded-md border border-border px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs ${badgeBg}`}>
                              {isRetro ? "Retro" : "Poker Planning"}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                      </div>

                      {/* Details Row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
                        {r.created_by_username && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="font-medium text-foreground">
                              {r.created_by_username}
                            </span>
                          </div>
                        )}
                        {r.created_at && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>{formatDate(r.created_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* View All Button */}
            {hasMoreRooms && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAllRoomsModal(true)}
                  className="group flex w-full items-center justify-center gap-3 rounded-md border-2 border-primary bg-card px-4 py-3 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary hover:bg-primary/10 hover:text-primary hover:shadow-md"
                >
                  <ClipboardList className="h-5 w-5" />
                  <span>Tüm odaları gör</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-primary bg-primary text-xs font-bold text-primary-foreground">
                    {displayedRooms.length - 20}
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

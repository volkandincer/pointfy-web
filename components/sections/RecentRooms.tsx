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
    <section className="mt-6">
      <div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-40 animate-pulse rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
              />
            ))}
          </div>
        ) : displayedRooms.length > 0 ? (
          <>
            {/* Rooms List */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedRooms.map((r) => {
                const isRetro = r.room_type === "retro";
                const cardColor = isRetro 
                  ? { border: "#9333ea", borderDark: "#a855f7" } // purple
                  : { border: "#2563eb", borderDark: "#3b82f6" }; // blue
                const RoomIcon = isRetro ? RefreshCw : Users;
                
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRoomClick(r.id)}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white p-5 text-left transition-all hover:border-gray-400 hover:shadow-lg cursor-pointer dark:border-gray-700 dark:bg-gray-900"
                    style={{
                      borderColor: cardColor.border,
                    }}
                  >
                    {/* Top Color Bar */}
                    <div
                      className="absolute left-0 top-0 h-1.5 w-full"
                      style={{ backgroundColor: cardColor.border }}
                    />

                    {/* Icon */}
                    <div 
                      className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 transition-transform group-hover:scale-105"
                      style={{
                        borderColor: cardColor.border,
                        backgroundColor: `${cardColor.border}15`,
                      }}
                    >
                      <RoomIcon 
                        className="h-5 w-5"
                        style={{ color: cardColor.border }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-2 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <h3 className="truncate text-base font-bold text-gray-900 dark:text-white line-clamp-2">
                              {r.name || "İsimsiz Oda"}
                            </h3>
                            {r.is_private && (
                              <Lock className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md border border-gray-300 bg-gray-50 px-2 py-1 font-mono text-xs font-semibold text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                              {r.code}
                            </span>
                            <span 
                              className="rounded-md border px-2 py-1 text-xs font-medium shadow-sm"
                              style={{
                                borderColor: cardColor.border,
                                backgroundColor: `${cardColor.border}15`,
                                color: cardColor.border,
                              }}
                            >
                              {isRetro ? "Retro" : "Poker Planning"}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 dark:text-gray-500" />
                      </div>

                      {/* Details */}
                      <div className="mt-auto flex flex-wrap items-center gap-3 border-t-2 pt-3" style={{ borderTopColor: `${cardColor.border}40` }}>
                        {r.created_by_username && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Users className="h-3.5 w-3.5" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {r.created_by_username}
                            </span>
                          </div>
                        )}
                        {r.created_at && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="h-3.5 w-3.5" />
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
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => setShowAllRoomsModal(true)}
                  variant="secondary"
                  size="sm"
                  icon={ClipboardList}
                  className="!border-blue-600 !text-blue-600 hover:!border-blue-700 hover:!bg-blue-50 dark:!border-blue-500 dark:!text-blue-400 dark:hover:!bg-blue-900/20"
                >
                  Tüm Odaları Gör ({displayedRooms.length - 20})
                </Button>
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

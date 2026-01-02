"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, ChevronRight, Search, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import RoomPinModal from "@/components/rooms/RoomPinModal";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";
import { useToastContext } from "@/contexts/ToastContext";
import {
  checkRoomEntry,
  verifyRoomPin,
  addUserToRoom,
} from "@/lib/roomUtils";

export default function RoomsPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const router = useRouter();
  const { showToast } = useToastContext();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
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
        setLoading(true);
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

        const { data, error: fetchError } = await supabase
          .from("rooms")
          .select("id, name, code, created_by_username, is_active, created_at, room_type")
          .eq("is_active", true)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (!mounted) return;

        if (fetchError) {
          showToast("Odalar yüklenirken bir hata oluştu.", "error");
          setRooms([]);
        } else {
          setRooms(data || []);
        }
      } catch {
        if (!mounted) return;
        showToast("Odalar yüklenirken bir hata oluştu.", "error");
        setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRooms();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const handleRoomClick = async (roomId: string) => {
    try {
      const result = await checkRoomEntry(roomId);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      if (result.success && result.room) {
        router.push(`/app/rooms/${roomId}`);
      } else if (result.needsPin && result.room) {
        setSelectedRoom({ id: roomId, code: result.room.code });
        setShowPinModal(true);
      } else {
        showToast("Bu odaya erişim sağlanamadı.", "error");
      }
    } catch {
      showToast("Odaya erişilirken bir hata oluştu.", "error");
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
      setPinError(null);
      router.push(`/app/rooms/${selectedRoom.id}`);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setPinLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const query = searchQuery.toLowerCase();
    return rooms.filter(
      (room) =>
        room.name?.toLowerCase().includes(query) ||
        room.code?.toLowerCase().includes(query) ||
        room.created_by_username?.toLowerCase().includes(query)
    );
  }, [rooms, searchQuery]);

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <SectionHeader
                title="Odalar"
                description="Aktif odalara katılın veya yeni bir oda oluşturun"
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.push("/app/rooms/create")}
                    icon={Plus}
                  >
                    Yeni Oda Oluştur
                  </Button>
                }
              />
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Oda adı, kod veya oluşturan kişi ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border-2 border-input bg-input px-10 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Rooms List */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-lg border-2 border-border bg-muted"
                  />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <EmptyState
                icon={Home}
                title={searchQuery ? "Arama sonucu bulunamadı" : "Henüz oda yok"}
                description={
                  searchQuery
                    ? "Arama kriterlerinize uygun oda bulunamadı."
                    : "İlk odayı oluşturarak başlayın."
                }
                actionLabel={searchQuery ? undefined : "Yeni Oda Oluştur"}
                onAction={
                  searchQuery
                    ? undefined
                    : () => router.push("/app/rooms/create")
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRooms.map((room) => {
                  const isRetro = room.room_type === "retro";
                  const borderColor = isRetro
                    ? "border-l-primary"
                    : "border-l-primary";
                  const iconBgColor = isRetro
                    ? "bg-primary/10"
                    : "bg-primary/10";
                  const iconBorderColor = isRetro
                    ? "border-primary/50"
                    : "border-primary/50";
                  const iconTextColor = isRetro
                    ? "text-primary"
                    : "text-primary";

                  return (
                    <button
                      key={room.id}
                      onClick={() => handleRoomClick(room.id)}
                      className={`group relative flex min-h-[140px] flex-col overflow-hidden rounded-lg border-l-4 ${borderColor} border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 text-left shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl`}
                    >
                      {/* Glow Effect */}
                      <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
                      
                      {/* Icon */}
                      <div className="relative mb-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 ${iconBorderColor} ${iconBgColor} transition-transform group-hover:scale-110`}
                        >
                          <Home className={`h-6 w-6 ${iconTextColor}`} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="relative flex-1">
                        <h3 className="mb-2 truncate text-lg font-bold text-card-foreground">
                          {room.name || "Oda"}
                        </h3>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-md border-2 border-border bg-card px-2 py-0.5 text-xs font-semibold text-card-foreground shadow-sm">
                            {room.code}
                          </span>
                          {room.created_by_username && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {room.created_by_username}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isRetro ? "Retrospective" : "Planning Poker"}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="relative mt-4 flex justify-end">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-primary bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <RoomPinModal
        open={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPinError(null);
          setSelectedRoom(null);
        }}
        onSubmit={handlePinSubmit}
        loading={pinLoading}
        error={pinError}
      />
      <Footer navigationItems={navigationItems} />
    </>
  );
}

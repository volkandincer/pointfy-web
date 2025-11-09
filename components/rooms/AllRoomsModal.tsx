"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import RoomPinModal from "@/components/rooms/RoomPinModal";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";
import {
  checkRoomEntry,
  verifyRoomPin,
  addUserToRoom,
} from "@/lib/roomUtils";

interface AllRoomsModalProps {
  open: boolean;
  onClose: () => void;
}

const AllRoomsModal = memo(function AllRoomsModal({
  open,
  onClose,
}: AllRoomsModalProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
    if (!open) return;

    let mounted = true;
    async function fetchRooms() {
      try {
        setLoading(true);
        setError(null);
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

        const { data, error: fetchError } = await supabase
          .from("rooms")
          .select("id, name, code, created_by_username, is_active, created_at")
          .eq("is_active", true)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        if (!mounted) return;

        if (fetchError) {
          setError(fetchError.message);
          setRooms([]);
        } else {
          setRooms(data || []);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRooms();
    return () => {
      mounted = false;
    };
  }, [open]);

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
      onClose();
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
      onClose();
      router.push(`/app/rooms/${selectedRoom.id}`);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <Modal open={open} title="Tüm Aktif Odalar" onClose={onClose}>
      <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-2 text-4xl">🏠</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hiç aktif oda yok.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room.id)}
                className="group w-full rounded-xl border border-gray-200/70 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-md dark:border-gray-800/70 dark:bg-gray-900 dark:hover:border-blue-500/50"
              >
                <div className="flex items-center gap-4">
                  {/* Icon Container */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 text-xl shadow-sm dark:bg-blue-900/20">
                    🏠
                  </div>

                  {/* Content */}
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

                  {/* Arrow Icon */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition group-hover:scale-110">
                    <span className="text-sm font-bold">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="mt-6 w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Kapat
      </button>
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
    </Modal>
  );
});

export default AllRoomsModal;


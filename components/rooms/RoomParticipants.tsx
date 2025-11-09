"use client";

import { memo } from "react";
import { useRoomParticipants } from "@/hooks/useRoomParticipants";
import type { RoomParticipant } from "@/hooks/useRoomParticipants";

interface RoomParticipantsProps {
  roomCode: string;
  currentUserKey: string;
  isAdmin: boolean;
}

const RoomParticipants = memo(function RoomParticipants({
  roomCode,
  currentUserKey,
  isAdmin,
}: RoomParticipantsProps) {
  const { participants, loading, error } = useRoomParticipants(roomCode);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          👥 Katılımcılar
        </h3>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200/70 bg-red-50/50 p-6 shadow-sm dark:border-red-800/70 dark:bg-red-900/10">
        <p className="text-sm text-red-600 dark:text-red-400">
          Katılımcılar yüklenirken hata oluştu: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-blue-400/20 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-[0_4px_16px_rgba(59,130,246,0.1)] dark:border-blue-500/20 dark:from-gray-900 dark:to-blue-900/10">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md dark:bg-blue-500">
            <span className="text-lg">👥</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Odadaki Katılımcılar
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {participants.length} kişi bu odada
            </p>
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md dark:bg-blue-500">
          {participants.length}
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="py-6 text-center">
          <p className="mb-2 text-4xl">👤</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Henüz katılımcı yok
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Odada henüz kimse yok
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.user_key}
              participant={participant}
              isCurrentUser={participant.user_key === currentUserKey}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface ParticipantCardProps {
  participant: RoomParticipant;
  isCurrentUser: boolean;
}

const ParticipantCard = memo(function ParticipantCard({
  participant,
  isCurrentUser,
}: ParticipantCardProps) {
  const formatJoinedDate = (dateString: string, isCurrent: boolean) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    // Mevcut kullanıcı her zaman aktif
    if (isCurrent) {
      return "Aktif";
    }

    // Son 5 dakika içinde katılanlar aktif sayılır
    if (diffMins < 5) {
      return "Aktif";
    }

    // Diğerleri için katılım zamanını göster
    if (diffMins < 60) return `${diffMins} dakika önce katıldı`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce katıldı`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce katıldı`;
  };

  return (
    <div
      className={`group relative flex items-center gap-4 rounded-xl border-2 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isCurrentUser
          ? "border-blue-400/60 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm dark:border-blue-500/60 dark:from-blue-900/20 dark:to-blue-800/10"
          : "border-gray-200/70 bg-white hover:border-blue-300/50 hover:bg-blue-50/30 dark:border-gray-700/70 dark:bg-gray-800/50 dark:hover:border-blue-500/30 dark:hover:bg-blue-900/10"
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-md transition-transform group-hover:scale-110 ${
            isCurrentUser
              ? "bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600"
              : "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
          }`}
        >
          {participant.username.charAt(0).toUpperCase()}
        </div>
        {isCurrentUser && (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-500 text-[10px] font-bold text-white shadow-sm dark:border-gray-900">
            ✓
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 flex-wrap">
          <p
            className={`truncate text-base font-bold ${
              isCurrentUser
                ? "text-blue-900 dark:text-blue-100"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {participant.username}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {participant.is_admin && (
              <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                👑 Admin
              </span>
            )}
            {isCurrentUser && (
              <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm dark:bg-blue-500">
                Sen
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const status = formatJoinedDate(participant.joined_at, isCurrentUser);
            const isActive = status === "Aktif";
            
            return isActive ? (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
                {status}
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                🕐 {status}
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
});

export default RoomParticipants;


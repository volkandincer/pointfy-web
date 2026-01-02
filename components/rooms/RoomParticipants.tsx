"use client";

import { memo, useState } from "react";
import { Crown, Users, ChevronDown } from "lucide-react";
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
}: RoomParticipantsProps) {
  const { participants, loading, error } = useRoomParticipants(roomCode);
  const [showAll, setShowAll] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="rounded-md border-2 border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse border-2 border-border bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-red-300 bg-red-50 p-4 shadow-sm dark:border-red-700 dark:bg-red-900/10">
        <p className="text-xs text-red-600 dark:text-red-400">
          Katılımcılar yüklenirken hata oluştu: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border-2 border-border bg-card shadow-sm">
      {/* Accordion Header - Tıklanabilir */}
      <button
        onClick={() => participants.length > 0 && setShowAll(!showAll)}
        disabled={participants.length === 0}
        className="w-full p-4 text-left transition-colors hover:bg-accent/50 disabled:cursor-default disabled:hover:bg-card"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600 dark:text-white">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">
                Katılımcılar
              </h3>
              <p className="text-xs text-muted-foreground">
                {participants.length} kişi
              </p>
            </div>
          </div>
          {participants.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Avatar Stack */}
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((participant, idx) => (
                  <div
                    key={participant.user_key}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm dark:border-gray-900 ${
                      participant.user_key === currentUserKey
                        ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
                        : "border-purple-600 bg-purple-600 dark:border-purple-500 dark:bg-purple-500"
                    }`}
                    style={{ zIndex: 3 - idx }}
                    title={participant.username}
                  >
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              {/* Accordion Toggle Icon */}
              <div
                className={`flex h-8 w-8 items-center justify-center border-2 border-border bg-muted text-muted-foreground transition-all duration-200 ${
                  showAll
                    ? "rotate-180 bg-primary/10 border-primary"
                    : "hover:bg-accent"
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Accordion Content - Animasyonlu */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showAll && participants.length > 0
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t-2 border-border px-4 pb-4 pt-3">
          <div className="space-y-1.5 overflow-y-auto pr-2 max-h-80">
            {participants.map((participant) => (
              <CompactParticipantCard
                key={participant.user_key}
                participant={participant}
                isCurrentUser={participant.user_key === currentUserKey}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {participants.length === 0 && (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Henüz katılımcı yok
          </p>
        </div>
      )}
    </div>
  );
});

interface ParticipantCardProps {
  participant: RoomParticipant;
  isCurrentUser: boolean;
}

// Kompakt katılımcı kartı (scroll edilebilir listede kullanılır)
const CompactParticipantCard = memo(function CompactParticipantCard({
  participant,
  isCurrentUser,
}: ParticipantCardProps) {
  const formatJoinedDate = (dateString: string, isCurrent: boolean) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (isCurrent) return "Aktif";
    if (diffMins < 5) return "Aktif";
    if (diffMins < 60) return `${diffMins} dk önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} sa önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
  };

  const status = formatJoinedDate(participant.joined_at, isCurrentUser);
  const isActive = status === "Aktif";

  return (
    <div
      className={`group flex items-center gap-2 border-2 border-border p-2 transition-all hover:shadow-sm hover:border-primary ${
        isCurrentUser
          ? "border-primary/60 bg-primary/10"
          : "border-border bg-muted/50 hover:border-primary/50 hover:bg-primary/10"
      }`}
    >
      {/* Kompakt Avatar */}
      <div className="relative shrink-0">
        <div
          className={`flex h-8 w-8 items-center justify-center border-2 text-xs font-bold text-white shadow-sm ${
            isCurrentUser
              ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
              : "border-purple-600 bg-purple-600 dark:border-purple-500 dark:bg-purple-500"
          }`}
        >
          {participant.username.charAt(0).toUpperCase()}
        </div>
        {isCurrentUser && (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center border-2 border-white bg-green-600 text-[8px] font-bold text-white dark:border-gray-900">
            ✓
          </div>
        )}
      </div>

      {/* Kompakt Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={`truncate text-xs font-semibold ${
              isCurrentUser
                ? "text-primary"
                : "text-card-foreground"
            }`}
          >
            {participant.username}
          </p>
          {participant.is_admin && (
            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-md border-2 border-amber-300 bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm dark:border-amber-600 dark:bg-amber-600">
              <Crown className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isActive ? (
            <span className="flex items-center gap-1 rounded-md border-2 border-green-300 bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 shadow-sm dark:border-green-700 dark:bg-green-900/30 dark:text-green-400">
              <span className="h-1.5 w-1.5 border-2 border-green-600 bg-green-500 dark:border-green-400 dark:bg-green-400"></span>
              {status}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default RoomParticipants;


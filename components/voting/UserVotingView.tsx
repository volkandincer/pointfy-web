"use client";

import { memo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import VotingCardGrid from "./VotingCardGrid";
import { useVotes } from "@/hooks/useVotes";
import { useVotingSession } from "@/hooks/useVotingSession";
import type { TaskInfo } from "@/interfaces/Voting.interface";

interface UserVotingViewProps {
  roomId: string;
  activeTask: TaskInfo;
  userKey: string;
  username: string;
}

const UserVotingView = memo(function UserVotingView({
  roomId,
  activeTask,
  userKey,
  username,
}: UserVotingViewProps) {
  const router = useRouter();
  const { votes, loading: votesLoading } = useVotes(
    roomId,
    activeTask.id,
    false
  );
  const { remainingTime, isVotingActive } = useVotingSession(roomId);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const hasVoted = votes.some(
    (v) => v.user_key === userKey || v.user_name === username
  );

  useEffect(() => {
    const myVote = votes.find(
      (v) => v.user_key === userKey || v.user_name === username
    );
    if (myVote?.point !== null && myVote?.point !== undefined) {
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        setSelectedPoint(myVote.point);
      }, 0);
    }
  }, [votes, userKey, username]);

  useEffect(() => {
    if (activeTask.status === "completed") {
      setTimeout(() => {
        router.refresh();
      }, 3000);
    }
  }, [activeTask.status, router]);

  const handleVote = async (point: number) => {
    if (!activeTask || !isVotingActive) return;
    setSelectedPoint(point);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("votes").upsert({
        room_id: roomId,
        user_name: username,
        user_key: userKey,
        point,
        task_id: activeTask.id,
      });
      if (error) {
        console.error("Vote error:", error);
        setSelectedPoint(null);
      }
    } catch (err) {
      console.error("Vote exception:", err);
      setSelectedPoint(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {activeTask.title}
          </h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {isVotingActive ? "🔄 Aktif" : "⏸️ Beklemede"}
          </span>
        </div>
        {activeTask.description && (
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {activeTask.description}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Toplam Katılımcı
            </span>
            <p className="font-semibold text-gray-900 dark:text-white">
              {votes.length}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Senin Puanın
            </span>
            <p className="font-semibold text-gray-900 dark:text-white">
              {selectedPoint ?? "Henüz puanlanmadı"}
            </p>
          </div>
        </div>
      </div>

      {isVotingActive && (
        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kalan Süre
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {remainingTime} saniye
            </p>
          </div>
        </div>
      )}

      {isVotingActive && (
        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
          <VotingCardGrid
            selectedPoint={selectedPoint}
            hasVoted={hasVoted}
            isVotingActive={isVotingActive}
            onVote={handleVote}
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Katılımcı Puanları
        </h3>
        {votesLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Yükleniyor...
          </p>
        ) : votes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-2 text-4xl">📊</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Henüz puan yok
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Katılımcılar puan vermeye başladığında burada görünecek
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {votes.map((vote) => (
              <div
                key={vote.user_key || vote.user_name}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {vote.user_name}
                  </span>
                  {vote.user_key === userKey && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Sen
                    </span>
                  )}
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {vote.point ?? "Girilmedi"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default UserVotingView;

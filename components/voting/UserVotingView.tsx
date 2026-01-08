"use client";

import { memo, useState, useEffect } from "react";
import { RefreshCw, Pause, BarChart3, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import VotingCardGrid from "./VotingCardGrid";
import EmptyState from "@/components/jira/EmptyState";
import { useVotes } from "@/hooks/useVotes";
import { useVotingSession } from "@/hooks/useVotingSession";
import type { TaskInfo } from "@/interfaces/Voting.interface";

interface UserVotingViewProps {
  roomId: string;
  activeTask: TaskInfo;
  userKey: string;
  username: string;
  canVote?: boolean;
}

const UserVotingView = memo(function UserVotingView({
  roomId,
  activeTask,
  userKey,
  username,
  canVote = true,
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
    if (!activeTask || !isVotingActive || !canVote) return;
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
        // Vote error
        setSelectedPoint(null);
      }
    } catch (err) {
      // Vote exception
      setSelectedPoint(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {activeTask.title}
          </h2>
          <span className="flex items-center gap-1.5 rounded-md border-2 border-blue-300 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {isVotingActive ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Aktif
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                Beklemede
              </>
            )}
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
        <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kalan Süre
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {remainingTime} saniye
            </p>
          </div>
          {remainingTime === 0 && votes.length === 0 && (
            <div className="mt-4 border-2 border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900/20">
              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                ⏱️ Süre doldu ve henüz puan verilmedi
              </p>
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                Admin yeni bir task seçebilir veya oylamayı iptal edebilir
              </p>
            </div>
          )}
        </div>
      )}

      {isVotingActive && canVote && (
        <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <VotingCardGrid
            selectedPoint={selectedPoint}
            hasVoted={hasVoted}
            isVotingActive={isVotingActive}
            onVote={handleVote}
          />
        </div>
      )}

      {isVotingActive && !canVote && (
        <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <div className="flex items-center gap-2 rounded-md border-2 border-amber-300 bg-amber-50 px-4 py-2 dark:border-amber-700 dark:bg-amber-900/20">
              <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="text-center">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  İzleyici Modu
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  İzleyiciler oy veremez, sadece görüntüleyebilir
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Katılımcı Puanları
        </h3>
        {votesLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Yükleniyor...
          </p>
        ) : votes.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Henüz puan yok"
            description="Katılımcılar puan vermeye başladığında burada görünecek"
          />
        ) : (
          <div className="space-y-2">
            {votes.map((vote) => (
              <div
                key={vote.user_key || vote.user_name}
                className="flex items-center justify-between border-2 border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {vote.user_name}
                  </span>
                  {vote.user_key === userKey && (
                    <span className="rounded-md border-2 border-blue-300 bg-blue-100 px-2 py-0.5 text-xs text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300">
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

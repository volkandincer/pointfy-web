"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useVotes } from "@/hooks/useVotes";
import { useVotingSession } from "@/hooks/useVotingSession";
import type { TaskInfo } from "@/interfaces/Voting.interface";

interface AdminVotingViewProps {
  roomId: string;
  activeTask: TaskInfo;
  isAdmin?: boolean; // Admin kontrolü için
}

const AdminVotingView = memo(function AdminVotingView({
  roomId,
  activeTask,
  isAdmin = true, // Varsayılan olarak true, ama kontrol için kullanılabilir
}: AdminVotingViewProps) {
  const { votes, loading: votesLoading } = useVotes(
    roomId,
    activeTask.id,
    false
  );
  const { remainingTime, isVotingActive } = useVotingSession(roomId);
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);

  const handleCompleteTask = useCallback(async () => {
    // Admin kontrolü - sadece admin task'ı bitirebilir
    if (!isAdmin) {
      alert("Bu işlem için admin yetkisi gereklidir.");
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", activeTask.id);
      if (error) throw error;
      
      // Task başarıyla tamamlandı
      setTaskCompleted(true);
      
      // Web'de zaten room detail sayfasındayız, yönlendirme yapmaya gerek yok
      // Realtime subscription sayesinde activeTask null olacak ve "Aktif Task Yok" ekranı gösterilecek
    } catch (err) {
      console.error("Complete task error:", err);
      alert("Task tamamlanamadı. Lütfen tekrar deneyin.");
    }
  }, [activeTask.id, isAdmin]);
  
  // Task completed olduğunda otomatik olarak algıla (realtime subscription'dan)
  useEffect(() => {
    if (activeTask.status === "completed" && !taskCompleted) {
      setTaskCompleted(true);
      // Web'de zaten room detail sayfasındayız, yönlendirme yapmaya gerek yok
      // Realtime subscription sayesinde activeTask null olacak ve "Aktif Task Yok" ekranı gösterilecek
    }
  }, [activeTask.status, taskCompleted]);

  const validVotes = votes.filter(
    (v) => v.point !== null && v.point !== undefined
  );
  const avgPoint =
    validVotes.length > 0
      ? Math.round(
          validVotes.reduce((sum, v) => sum + (v.point || 0), 0) /
            validVotes.length
        )
      : 0;
  const maxPoint =
    validVotes.length > 0
      ? Math.max(...validVotes.map((v) => v.point || 0))
      : 0;
  const minPoint =
    validVotes.length > 0
      ? Math.min(...validVotes.map((v) => v.point || 0))
      : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {activeTask.title}
          </h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {isVotingActive
              ? "🔄 Aktif"
              : activeTask.status === "completed"
              ? "✅ Tamamlandı"
              : "⏸️ Beklemede"}
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

      <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-6 dark:border-amber-800/70 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Admin Modu
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Puanlama yapamazsınız
            </p>
          </div>
        </div>
      </div>

      {activeTask.status === "completed" && validVotes.length > 0 && (
        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            📊 Final Sonuçları
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Ortalama Puan
              </span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {avgPoint}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                En Yüksek
              </span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {maxPoint}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">En Düşük</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {minPoint}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Toplam Katılımcı
              </span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {validVotes.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {isVotingActive && (
        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
          <button
            onClick={handleCompleteTask}
            className="w-full rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Taskı Bitir
          </button>
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
          </div>
        ) : (
          <div className="space-y-2">
            {votes.map((vote) => (
              <div
                key={vote.user_key || vote.user_name}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {vote.user_name}
                </span>
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

export default AdminVotingView;

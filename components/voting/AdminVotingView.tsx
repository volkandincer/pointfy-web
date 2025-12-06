"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, Pause, Crown, BarChart3 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useVotes } from "@/hooks/useVotes";
import { useVotingSession } from "@/hooks/useVotingSession";
import { useToastContext } from "@/contexts/ToastContext";
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
  const { showToast } = useToastContext();
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
      showToast("Bu işlem için admin yetkisi gereklidir.", "error");
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
      showToast("Task başarıyla tamamlandı!", "success");

      // Web'de zaten room detail sayfasındayız, yönlendirme yapmaya gerek yok
      // Realtime subscription sayesinde activeTask null olacak ve "Aktif Task Yok" ekranı gösterilecek
    } catch {
      showToast("Task tamamlanamadı. Lütfen tekrar deneyin.", "error");
    }
  }, [activeTask.id, isAdmin, showToast]);

  const validVotes = votes.filter(
    (v) => v.point !== null && v.point !== undefined
  );
  const avgPointRaw =
    validVotes.length > 0
      ? validVotes.reduce((sum, v) => sum + (v.point || 0), 0) /
        validVotes.length
      : 0;
  const avgPoint = Math.round(avgPointRaw);
  const maxPoint =
    validVotes.length > 0
      ? Math.max(...validVotes.map((v) => v.point || 0))
      : 0;
  const minPoint =
    validVotes.length > 0
      ? Math.min(...validVotes.map((v) => v.point || 0))
      : 0;

  // Task completed olduğunda otomatik olarak algıla (realtime subscription'dan)
  useEffect(() => {
    if (activeTask.status === "completed" && !taskCompleted) {
      setTaskCompleted(true);
    }
  }, [activeTask.status, taskCompleted]);

  return (
    <div className="space-y-6">
      <div className="border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {activeTask.title}
          </h2>
          <span className="flex items-center gap-1.5 rounded-lg border-2 border-blue-300 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {isVotingActive ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Aktif
              </>
            ) : activeTask.status === "completed" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tamamlandı
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
        </div>
      </div>

      {isVotingActive && (
        <div className="border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
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

      <div className="border-2 border-amber-300 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
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
        <div className="border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <BarChart3 className="h-5 w-5" />
            Final Sonuçları
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
        <div className="border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={handleCompleteTask}
            className="w-full border-2 border-gray-900 bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 hover:border-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Taskı Bitir
          </button>
        </div>
      )}

      <div className="border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Katılımcı Puanları
        </h3>
        {votesLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Yükleniyor...
          </p>
        ) : votes.length === 0 ? (
          <div className="py-8 text-center">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Henüz puan yok
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {votes.map((vote) => (
              <div
                key={vote.user_key || vote.user_name}
                className="flex items-center justify-between border-2 border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
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

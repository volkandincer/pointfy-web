"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, Pause, Crown, BarChart3, X, RotateCcw } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useVotes } from "@/hooks/useVotes";
import { useVotingSession } from "@/hooks/useVotingSession";
import { useToastContext } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/jira/EmptyState";
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
    true // Admin her zaman tüm puanları görebilmeli
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

  const handleCancelVoting = useCallback(async () => {
    // Admin kontrolü - sadece admin oylamayı iptal edebilir
    if (!isAdmin) {
      showToast("Bu işlem için admin yetkisi gereklidir.", "error");
      return;
    }

    try {
      const supabase = getSupabase();
      // Task'ı pending durumuna çevir
      const { error } = await supabase
        .from("tasks")
        .update({ status: "pending" })
        .eq("id", activeTask.id);
      if (error) throw error;

      showToast("Oylama iptal edildi, task beklemede durumuna alındı.", "success");
    } catch {
      showToast("Oylama iptal edilemedi. Lütfen tekrar deneyin.", "error");
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
      <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {activeTask.title}
          </h2>
          <span className="flex items-center gap-1.5 rounded-md border-2 border-blue-300 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300">
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
        <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kalan Süre
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
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
        <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
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
        <div className="space-y-3">
          {/* Puan Durumu */}
          {validVotes.length === 0 && (
            <div className="border-2 border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                ⚠️ Henüz hiç puan verilmedi
              </p>
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                Katılımcılar puan vermeye başladığında burada görünecek
              </p>
            </div>
          )}

          {/* Admin Aksiyon Butonları */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button
              onClick={handleCompleteTask}
              variant="primary"
              size="md"
              fullWidth
              icon={CheckCircle2}
              disabled={validVotes.length === 0}
            >
              Task&apos;ı Bitir
            </Button>
            <Button
              onClick={handleCancelVoting}
              variant="secondary"
              size="md"
              fullWidth
              icon={X}
            >
              Oylamayı İptal Et
            </Button>
            <Button
              onClick={handleCancelVoting}
              variant="outline"
              size="md"
              fullWidth
              icon={RotateCcw}
            >
              Başka Task Seç
            </Button>
          </div>
        </div>
      )}

      {/* Oylama aktif değilse ve task pending ise */}
      {!isVotingActive && activeTask.status === "pending" && (
        <div className="border-2 border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Oylama beklemede
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Task listesinden yeni bir task seçebilir veya bu task&apos;ı tekrar aktif edebilirsiniz.
          </p>
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

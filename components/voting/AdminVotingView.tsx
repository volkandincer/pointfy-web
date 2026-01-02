"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, Pause, Crown, BarChart3, X, RotateCcw } from "lucide-react";
import Card from "@/components/ui/Card";
import { getSupabase } from "@/lib/supabase";
import { useVotes } from "@/hooks/useVotes";
import { useVotingSession } from "@/hooks/useVotingSession";
import { useToastContext } from "@/contexts/ToastContext";
import Button from "@/components/ui/Button";
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
      <Card padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-card-foreground">
            {activeTask.title}
          </h2>
          <span className="flex items-center gap-1.5 rounded-md border-2 border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
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
          <p className="mb-4 text-muted-foreground">
            {activeTask.description}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">
              Toplam Katılımcı
            </span>
            <p className="font-semibold text-card-foreground">
              {votes.length}
            </p>
          </div>
        </div>
      </Card>

      {isVotingActive && (
        <Card padding="lg">
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground">
              Kalan Süre
            </p>
            <p className="text-3xl font-bold text-card-foreground">
              {remainingTime} saniye
            </p>
          </div>
        </Card>
      )}

      <Card padding="lg" borderColor="primary" className="border-2 border-primary/50 bg-primary/10">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold text-card-foreground">
              Admin Modu
            </p>
            <p className="text-sm text-muted-foreground">
              Puanlama yapamazsınız
            </p>
          </div>
        </div>
      </Card>

      {activeTask.status === "completed" && validVotes.length > 0 && (
        <Card padding="lg">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <BarChart3 className="h-5 w-5" />
            Final Sonuçları
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                Ortalama Puan
              </span>
              <p className="font-semibold text-card-foreground">
                {avgPoint}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">
                En Yüksek
              </span>
              <p className="font-semibold text-card-foreground">
                {maxPoint}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">En Düşük</span>
              <p className="font-semibold text-card-foreground">
                {minPoint}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">
                Toplam Katılımcı
              </span>
              <p className="font-semibold text-card-foreground">
                {validVotes.length}
              </p>
            </div>
          </div>
        </Card>
      )}

      {isVotingActive && (
        <div className="space-y-3">
          {/* Puan Durumu */}
          {validVotes.length === 0 && (
            <Card padding="md" borderColor="primary" className="border-2 border-primary/50 bg-primary/10">
              <p className="text-sm font-semibold text-primary">
                ⚠️ Henüz hiç puan verilmedi
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Katılımcılar puan vermeye başladığında burada görünecek
              </p>
            </Card>
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
        <Card padding="md">
          <p className="mb-3 text-sm font-semibold text-card-foreground">
            Oylama beklemede
          </p>
          <p className="text-xs text-muted-foreground">
            Task listesinden yeni bir task seçebilir veya bu task&apos;ı tekrar aktif edebilirsiniz.
          </p>
        </Card>
      )}

      <Card padding="lg">
        <h3 className="mb-4 text-lg font-semibold text-card-foreground">
          Katılımcı Puanları
        </h3>
        {votesLoading ? (
          <p className="text-sm text-muted-foreground">
            Yükleniyor...
          </p>
        ) : votes.length === 0 ? (
          <div className="py-8 text-center">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium text-card-foreground">
              Henüz puan yok
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {votes.map((vote) => (
              <div
                key={vote.user_key || vote.user_name}
                className="flex items-center justify-between rounded-md border-2 border-border bg-muted p-3"
              >
                <span className="font-medium text-card-foreground">
                  {vote.user_name}
                </span>
                <span className="font-semibold text-card-foreground">
                  {vote.point ?? "Girilmedi"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
});

export default AdminVotingView;

"use client";

import { memo, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { TaskInfo } from "@/interfaces/Voting.interface";

interface TaskCardProps {
  task: TaskInfo;
  roomId: string;
  isAdmin: boolean;
  onSetActive: (taskId: string) => Promise<void>;
}

const TaskCard = memo(function TaskCard({
  task,
  roomId,
  isAdmin,
  onSetActive,
}: TaskCardProps) {
  const [votes, setVotes] = useState<
    Array<{ user_name: string; user_key: string; point: number | null }>
  >([]);
  const [loadingVotes, setLoadingVotes] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function fetchVotes() {
      if (!task.id) return;
      setLoadingVotes(true);
      try {
        const supabase = getSupabase();
        // Task completed ise tüm puanları göster, değilse sadece admin görebilir
        const shouldShowAll =
          task.status === "completed" || (isAdmin && task.status === "active");

        if (shouldShowAll) {
          const { data } = await supabase
            .from("votes")
            .select("user_name, user_key, point")
            .eq("room_id", roomId)
            .eq("task_id", task.id);
          if (!mounted) return;
          setVotes(data || []);
        } else {
          setVotes([]);
        }
      } catch (err) {
        console.error("Fetch votes error:", err);
        if (!mounted) return;
        setVotes([]);
      } finally {
        if (mounted) setLoadingVotes(false);
      }
    }
    fetchVotes();

    // Realtime subscription for votes
    const supabase = getSupabase();
    const channel = supabase
      .channel(`task-votes-${task.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `task_id=eq.${task.id}`,
        },
        () => {
          fetchVotes();
        }
      );
    channel.subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [task.id, task.status, roomId, isAdmin]);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition ${
        task.status === "completed"
          ? "border-green-200/70 bg-green-50/50 dark:border-green-800/70 dark:bg-green-900/10"
          : task.status === "active"
            ? "border-blue-200/70 bg-blue-50/50 dark:border-blue-800/70 dark:bg-blue-900/10"
            : "border-gray-200/70 bg-white dark:border-gray-800/70 dark:bg-gray-900"
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {task.title}
            </h3>
            {task.status === "completed" && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                ✅ Tamamlandı
              </span>
            )}
            {task.status === "active" && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                🔄 Aktif
              </span>
            )}
            {task.status === "pending" && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                ⏳ Beklemede
              </span>
            )}
          </div>
          {task.description && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Oluşturan */}
        <div className="rounded-lg bg-gray-100/50 p-2 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">Oluşturan</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {task.created_by_username || "Bilinmiyor"}
          </p>
        </div>

        {/* Tarih */}
        <div className="rounded-lg bg-gray-100/50 p-2 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">Oluşturulma</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDate(task.created_at) || "-"}
          </p>
        </div>

        {/* Katılımcı Sayısı */}
        <div className="rounded-lg bg-gray-100/50 p-2 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Katılımcı
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {loadingVotes ? "..." : votes.length}
          </p>
        </div>

        {/* Ortalama Puan (sadece completed veya active task'larda) */}
        {(task.status === "completed" || task.status === "active") && (
          <div className="rounded-lg bg-gray-100/50 p-2 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ortalama
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {loadingVotes ? "..." : avgPoint > 0 ? avgPoint : "-"}
            </p>
          </div>
        )}
      </div>

      {/* Katılımcı Puanları (sadece admin ve completed/active task'larda) */}
      {isAdmin &&
        (task.status === "completed" || task.status === "active") &&
        votes.length > 0 && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
              Katılımcı Puanları
            </p>
            <div className="space-y-1.5">
              {votes.map((vote) => (
                <div
                  key={vote.user_key || vote.user_name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {vote.user_name}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {vote.point ?? "Girilmedi"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Action Button */}
      <div className="flex justify-end">
        {task.status === "completed" ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Bu task tamamlandı
          </span>
        ) : task.status === "active" ? (
          <span className="text-xs text-blue-600 dark:text-blue-400">
            🔄 Şu anda puanlama yapılıyor
          </span>
        ) : (
          <button
            onClick={() => onSetActive(task.id)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Puanlamaya Gönder
          </button>
        )}
      </div>
    </div>
  );
});

export default TaskCard;


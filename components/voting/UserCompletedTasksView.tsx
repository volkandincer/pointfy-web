"use client";

import { memo } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useVotes } from "@/hooks/useVotes";

interface UserCompletedTasksViewProps {
  roomId: string;
  userKey: string;
  username: string;
}

const UserCompletedTasksView = memo(function UserCompletedTasksView({
  roomId,
  userKey,
  username,
}: UserCompletedTasksViewProps) {
  const { completedTasks, loading } = useCompletedTasks(roomId);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div
            key={idx}
            className="h-40 animate-pulse border-l-4 border-l-indigo-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-indigo-500 dark:border-gray-700 dark:bg-gray-900"
          />
        ))}
      </div>
    );
  }

  if (completedTasks.length === 0) {
    return (
      <div className="border-2 border-gray-300 bg-white p-6 text-center shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-900">
        <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          Henüz tamamlanan task yok
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Task&apos;lar tamamlandığında burada görünecek
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tamamlanan Task Kartları
        </h2>
      </div>
      {completedTasks.map((task) => (
        <CompletedTaskCard
          key={task.id}
          task={task}
          roomId={roomId}
          userKey={userKey}
          username={username}
        />
      ))}
    </div>
  );
});

interface CompletedTaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    created_at?: string;
    updated_at?: string;
    created_by_username?: string;
    averagePoint: number;
    totalVotes: number;
    highestPoint: number;
    lowestPoint: number;
  };
  roomId: string;
  userKey: string;
  username: string;
}

const CompletedTaskCard = memo(function CompletedTaskCard({
  task,
  roomId,
  userKey,
  username,
}: CompletedTaskCardProps) {
  const { votes } = useVotes(roomId, task.id, true); // Always show all votes for completed tasks

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Bilinmiyor";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="group relative border-l-4 border-l-green-600 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-l-green-500 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-1.5 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
            {task.title}
          </h3>
          {task.description && (
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {task.description}
            </p>
          )}
        </div>
        <span className="ml-4 shrink-0 inline-flex items-center gap-1 rounded-md border-2 border-green-600 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 shadow-sm dark:border-green-500 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Tamamlandı
        </span>
      </div>

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-2 border-gray-300 bg-gray-50 p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Ortalama Puan
          </span>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
            {task.averagePoint}
          </p>
        </div>
        <div className="border-2 border-gray-300 bg-gray-50 p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Toplam Katılımcı
          </span>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
            {task.totalVotes}
          </p>
        </div>
        <div className="border-2 border-gray-300 bg-gray-50 p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            En Yüksek
          </span>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
            {task.highestPoint}
          </p>
        </div>
        <div className="border-2 border-gray-300 bg-gray-50 p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            En Düşük
          </span>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
            {task.lowestPoint}
          </p>
        </div>
      </div>

      {/* Votes List - Kim ne verdi */}
      {votes.length > 0 && (
        <div className="mb-3 border-2 border-gray-300 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
            Puanlar
          </h4>
          <div className="space-y-2">
            {votes.map((vote) => {
              const isCurrentUser =
                vote.user_key === userKey || vote.user_name === username;
              return (
                <div
                  key={vote.user_key || vote.user_name}
                  className={`flex items-center justify-between border-2 p-2.5 ${
                    isCurrentUser
                      ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                      : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {vote.user_name}
                    </span>
                    {isCurrentUser && (
                      <span className="inline-flex items-center gap-1 rounded-md border-2 border-blue-600 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
                        Sen
                      </span>
                    )}
                  </div>
                  <span className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                    {vote.point ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Oluşturan: {task.created_by_username || "Bilinmiyor"}
        </span>
        <span>{formatDate(task.updated_at)}</span>
      </div>
    </div>
  );
});

export default UserCompletedTasksView;


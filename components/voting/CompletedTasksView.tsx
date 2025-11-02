"use client";

import { memo } from "react";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";

interface CompletedTasksViewProps {
  roomId: string;
}

const CompletedTasksView = memo(function CompletedTasksView({
  roomId,
}: CompletedTasksViewProps) {
  const { completedTasks, loading } = useCompletedTasks(roomId);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yükleniyor...
        </p>
      </div>
    );
  }

  if (completedTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          🃏 Tamamlanan Task Kartları
        </h3>
        <div className="py-8 text-center">
          <p className="mb-2 text-4xl">📋</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Henüz tamamlanan task yok
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Task'lar tamamlandığında burada görünecek
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        🃏 Tamamlanan Task Kartları
      </h3>
      <div className="space-y-4">
        {completedTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {task.title}
              </h4>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                ✅ Tamamlandı
              </span>
            </div>
            {task.description && (
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                {task.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Ortalama Puan
                </span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {task.averagePoint}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Toplam Katılımcı
                </span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {task.totalVotes}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  En Yüksek
                </span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {task.highestPoint}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  En Düşük
                </span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {task.lowestPoint}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Oluşturan: {task.created_by_username || "Bilinmiyor"}</span>
              {task.updated_at && (
                <span>
                  {new Date(task.updated_at).toLocaleDateString("tr-TR")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default CompletedTasksView;

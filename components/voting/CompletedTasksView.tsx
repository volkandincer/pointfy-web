"use client";

import { memo } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
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
      <div className="rounded-md border-2 border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yükleniyor...
        </p>
      </div>
    );
  }

  if (completedTasks.length === 0) {
    return (
      <div className="rounded-md border-2 border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tamamlanan Task Kartları
          </h3>
        </div>
        <div className="py-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Henüz tamamlanan task yok
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Task&apos;lar tamamlandığında burada görünecek
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border-2 border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tamamlanan Task Kartları
        </h3>
      </div>
      <div className="space-y-4">
        {completedTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-md border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {task.title}
              </h4>
              <span className="inline-flex items-center gap-1 rounded-md border-2 border-green-300 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 shadow-sm dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                <CheckCircle2 className="h-3 w-3" />
                Tamamlandı
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

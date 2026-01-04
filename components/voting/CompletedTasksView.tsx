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
      <div className="border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Yükleniyor...
        </p>
      </div>
    );
  }

  if (completedTasks.length === 0) {
    return (
      <div className="border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
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
    <div className="border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Tamamlanan Task Kartları
        </h3>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {completedTasks.map((task) => (
          <div
            key={task.id}
            className="group relative border-l-4 border-l-green-600 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-l-green-500 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                {task.title}
              </h4>
              <span className="ml-4 shrink-0 inline-flex items-center gap-1 rounded-md border-2 border-green-600 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 shadow-sm dark:border-green-500 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Tamamlandı
              </span>
            </div>
            {task.description && (
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                {task.description}
              </p>
            )}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="border-2 border-gray-300 bg-gray-50 p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Ortalama Puan
                </span>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                  {task.averagePoint}
                </p>
              </div>
              <div className="border-2 border-gray-300 bg-gray-50 p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Toplam Katılımcı
                </span>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                  {task.totalVotes}
                </p>
              </div>
              <div className="border-2 border-gray-300 bg-gray-50 p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  En Yüksek
                </span>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                  {task.highestPoint}
                </p>
              </div>
              <div className="border-2 border-gray-300 bg-gray-50 p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  En Düşük
                </span>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                  {task.lowestPoint}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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

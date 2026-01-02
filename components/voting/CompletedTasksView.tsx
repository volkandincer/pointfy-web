"use client";

import { memo } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import Card from "@/components/ui/Card";
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
      <Card padding="lg">
        <p className="text-sm text-muted-foreground">
          Yükleniyor...
        </p>
      </Card>
    );
  }

  if (completedTasks.length === 0) {
    return (
      <Card padding="lg">
        <div className="mb-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-card-foreground">
            Tamamlanan Task Kartları
          </h3>
        </div>
        <div className="py-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-sm font-medium text-card-foreground">
            Henüz tamamlanan task yok
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Task&apos;lar tamamlandığında burada görünecek
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="mb-4 flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        <h3 className="text-lg font-semibold text-card-foreground">
          Tamamlanan Task Kartları
        </h3>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {completedTasks.map((task) => (
          <Card
            key={task.id}
            padding="md"
            borderColor="primary"
            className="group relative border-l-4 border-l-green-600 dark:border-l-green-500"
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-card-foreground sm:text-base">
                {task.title}
              </h4>
              <span className="ml-4 shrink-0 inline-flex items-center gap-1 rounded-md border-2 border-green-600 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 shadow-sm dark:border-green-500 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Tamamlandı
              </span>
            </div>
            {task.description && (
              <p className="mb-3 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-md border-2 border-border bg-muted p-2 shadow-sm">
                <span className="text-xs text-muted-foreground">
                  Ortalama Puan
                </span>
                <p className="mt-1 text-sm font-bold text-card-foreground sm:text-base">
                  {task.averagePoint}
                </p>
              </div>
              <div className="rounded-md border-2 border-border bg-muted p-2 shadow-sm">
                <span className="text-xs text-muted-foreground">
                  Toplam Katılımcı
                </span>
                <p className="mt-1 text-sm font-bold text-card-foreground sm:text-base">
                  {task.totalVotes}
                </p>
              </div>
              <div className="rounded-md border-2 border-border bg-muted p-2 shadow-sm">
                <span className="text-xs text-muted-foreground">
                  En Yüksek
                </span>
                <p className="mt-1 text-sm font-bold text-card-foreground sm:text-base">
                  {task.highestPoint}
                </p>
              </div>
              <div className="rounded-md border-2 border-border bg-muted p-2 shadow-sm">
                <span className="text-xs text-muted-foreground">
                  En Düşük
                </span>
                <p className="mt-1 text-sm font-bold text-card-foreground sm:text-base">
                  {task.lowestPoint}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Oluşturan: {task.created_by_username || "Bilinmiyor"}</span>
              {task.updated_at && (
                <span>
                  {new Date(task.updated_at).toLocaleDateString("tr-TR")}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
});

export default CompletedTasksView;

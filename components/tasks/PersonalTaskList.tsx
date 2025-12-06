"use client";

import { memo } from "react";
import { Edit, Trash2, Calendar, ClipboardList } from "lucide-react";
import EmptyState from "@/components/jira/EmptyState";
import type { PersonalTask } from "@/interfaces/PersonalTask.interface";

interface PersonalTaskListProps {
  tasks: PersonalTask[];
  onDelete: (taskId: string) => Promise<void>;
  onEdit: (task: PersonalTask) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Genel",
  work: "İş",
  personal: "Kişisel",
  meeting: "Toplantı",
  project: "Proje",
};

const PRIORITY_COLORS = {
  1: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", label: "Düşük" },
  2: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Orta" },
  3: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Yüksek" },
};

const PersonalTaskList = memo(function PersonalTaskList({
  tasks,
  onDelete,
  onEdit,
}: PersonalTaskListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Tarih yok";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  const getPriorityInfo = (priority: number) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS[1];
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 sm:gap-4">
      {tasks.map((t) => {
        const priorityInfo = getPriorityInfo(t.priority ?? 1);
        return (
          <div
            key={t.id}
            className="group relative border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            style={{
              borderLeftColor: t.priority === 3 ? '#dc2626' : t.priority === 2 ? '#2563eb' : '#6b7280',
            }}
          >

            {/* Content */}
            <div className="relative">
              {/* Header */}
              <div className="mb-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="flex-1 text-lg font-bold text-gray-900 dark:text-white">
                    {t.title}
                  </h3>
                  <span
                    className={`shrink-0 border-2 px-2.5 py-1 text-xs font-semibold ${priorityInfo.bg} ${priorityInfo.text}`}
                    style={{
                      borderColor: t.priority === 3 ? '#dc2626' : t.priority === 2 ? '#2563eb' : '#6b7280',
                    }}
                  >
                    {priorityInfo.label}
                  </span>
                </div>
                {t.description && (
                  <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {t.description}
                  </p>
                )}
              </div>

              {/* Info Grid */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                {/* Category */}
                <div className="border-2 border-gray-300 bg-gray-50 p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Kategori
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getCategoryLabel(t.category)}
                  </p>
                </div>

                {/* Priority */}
                <div className="border-2 border-gray-300 bg-gray-50 p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Öncelik
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {priorityInfo.label}
                  </p>
                </div>
              </div>

              {/* Created Date */}
              {t.created_at && (
                <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(t.created_at)}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 border-t-2 border-gray-300 pt-4 dark:border-gray-700">
                <button
                  onClick={() => onEdit(t)}
                  className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 hover:border-blue-700"
                >
                  <Edit className="h-4 w-4" />
                  Düzenle
                </button>
                <button
                  onClick={() => {
                    if (confirm(`"${t.title}" task'ını silmek istediğinize emin misiniz?`)) {
                      onDelete(t.id);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-md border-2 border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500 dark:bg-gray-900 dark:text-red-500 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {tasks.length === 0 && (
        <div className="col-span-full">
          <EmptyState
            icon={ClipboardList}
            title="Henüz task yok"
            description="İlk task'ınızı ekleyerek başlayın"
          />
        </div>
      )}
    </div>
  );
});

export default PersonalTaskList;

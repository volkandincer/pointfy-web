"use client";

import { memo } from "react";
import Link from "next/link";
import type { PersonalTask } from "@/interfaces/PersonalTask.interface";

interface PersonalTaskListProps {
  tasks: PersonalTask[];
  onDelete: (taskId: string) => Promise<void>;
}

const PersonalTaskList = memo(function PersonalTaskList({ tasks, onDelete }: PersonalTaskListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {tasks.map((t) => (
        <div key={t.id} className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">{t.title}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Öncelik {t.priority ?? 1}</span>
          </div>
          {t.description && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{t.description}</p>
          )}
          <div className="flex items-center gap-3">
            <Link href={`/app/rooms`} className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">Odaya Git</Link>
            <button onClick={() => onDelete(t.id)} className="text-sm text-red-600 hover:underline">Sil</button>
          </div>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Henüz kişisel task yok.</div>
      )}
    </div>
  );
});

export default PersonalTaskList;



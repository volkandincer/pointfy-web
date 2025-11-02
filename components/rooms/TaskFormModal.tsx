"use client";

import { memo, useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, description?: string) => Promise<void>;
  loading?: boolean;
}

const TaskFormModal = memo(function TaskFormModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: TaskFormModalProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!title.trim()) return;
      await onSubmit(title.trim(), description.trim() || undefined);
      setTitle("");
      setDescription("");
      onClose();
    },
    [description, onClose, onSubmit, title]
  );

  return (
    <Modal open={open} onClose={onClose} title="Yeni Task Ekle">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="task-title"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Başlık
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task başlığı"
            maxLength={200}
            required
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="task-desc"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Açıklama (opsiyonel)
          </label>
          <textarea
            id="task-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task açıklaması"
            maxLength={500}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default TaskFormModal;

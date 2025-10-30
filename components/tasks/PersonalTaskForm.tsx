"use client";

import { memo, useCallback, useState } from "react";
import type { PersonalTaskInput } from "@/interfaces/PersonalTask.interface";

interface PersonalTaskFormProps {
  onCreate: (input: PersonalTaskInput) => Promise<void>;
}

const PersonalTaskForm = memo(function PersonalTaskForm({
  onCreate,
}: PersonalTaskFormProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!title.trim()) return;
      setLoading(true);
      try {
        await onCreate({
          title: title.trim(),
          description: description.trim() || undefined,
        });
        setTitle("");
        setDescription("");
      } finally {
        setLoading(false);
      }
    },
    [description, onCreate, title]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="pt-title"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Başlık
        </label>
        <input
          id="pt-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label
          htmlFor="pt-desc"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Açıklama (opsiyonel)
        </label>
        <textarea
          id="pt-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
      >
        {loading ? "Ekleniyor..." : "Ekle"}
      </button>
    </form>
  );
});

export default PersonalTaskForm;

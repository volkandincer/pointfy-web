"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { PersonalTaskInput } from "@/interfaces/PersonalTask.interface";

interface PersonalTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: PersonalTaskInput) => Promise<void>;
}

const CATEGORY_PRESETS = ["general", "work", "personal", "meeting", "project"] as const;
const PRIORITY_PRESETS = [
  { key: 1, label: "Düşük" },
  { key: 2, label: "Orta" },
  { key: 3, label: "Yüksek" },
];

const PersonalTaskModal = memo(function PersonalTaskModal({ open, onClose, onCreate }: PersonalTaskModalProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("general");
  const [priority, setPriority] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const categories = useMemo(() => CATEGORY_PRESETS, []);
  const priorities = useMemo(() => PRIORITY_PRESETS, []);

  const submit = useCallback(async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
      });
      setTitle("");
      setDescription("");
      setCategory("general");
      setPriority(1);
      onClose();
    } finally {
      setLoading(false);
    }
  }, [category, description, onClose, onCreate, priority, title]);

  return (
    <Modal open={open} onClose={onClose} title="Yeni Task Ekle">
      <div className="space-y-4">
        <div>
          <input
            placeholder="Task başlığı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <input
            placeholder="Açıklama (isteğe bağlı)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-xs ${
                  category === c
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">Öncelik</p>
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPriority(p.key)}
                className={`rounded-full px-3 py-1 text-xs ${
                  priority === p.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={loading || !title.trim()}
            onClick={submit}
            className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            Ekle
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default PersonalTaskModal;



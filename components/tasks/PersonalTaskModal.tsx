"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type {
  PersonalTask,
  PersonalTaskInput,
} from "@/interfaces/PersonalTask.interface";

interface PersonalTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: PersonalTaskInput, taskId?: string) => Promise<void>;
  initialTask?: PersonalTask;
}

const CATEGORY_PRESETS = [
  { value: "general", label: "Genel" },
  { value: "work", label: "İş" },
  { value: "personal", label: "Kişisel" },
  { value: "meeting", label: "Toplantı" },
  { value: "project", label: "Proje" },
] as const;
const PRIORITY_PRESETS = [
  { key: 1, label: "Düşük" },
  { key: 2, label: "Orta" },
  { key: 3, label: "Yüksek" },
];

const PersonalTaskModal = memo(function PersonalTaskModal({
  open,
  onClose,
  onSubmit,
  initialTask,
}: PersonalTaskModalProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("general");
  const [priority, setPriority] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const categories = useMemo(() => CATEGORY_PRESETS, []);
  const priorities = useMemo(() => PRIORITY_PRESETS, []);

  // Modal açıldığında veya initialTask değiştiğinde state'leri güncelle
  useEffect(() => {
    if (open) {
      setTitle(initialTask?.title || "");
      setDescription(initialTask?.description || "");
      setCategory(initialTask?.category || "general");
      setPriority(initialTask?.priority || 1);
    }
  }, [open, initialTask]);

  const submit = useCallback(async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          priority,
        },
        initialTask?.id
      );
      setTitle("");
      setDescription("");
      setCategory("general");
      setPriority(1);
      onClose();
    } finally {
      setLoading(false);
    }
  }, [
    category,
    description,
    onClose,
    onSubmit,
    priority,
    title,
    initialTask?.id,
  ]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-orange-600 bg-orange-50 dark:bg-orange-900/20">
            <CheckSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="font-bold">{initialTask ? "Taskı Düzenle" : "Yeni Task Ekle"}</span>
        </div>
      }
      className="sm:border-orange-600/30 dark:sm:border-orange-500/30"
    >
      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
            Task Başlığı <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            placeholder="Task başlığı..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-orange-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
            Açıklama <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(İsteğe Bağlı)</span>
          </label>
          <input
            placeholder="Açıklama..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-orange-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
            Kategori
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`rounded-md border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                  category === c.value
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm dark:border-orange-500 dark:bg-orange-600"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
            Öncelik
          </label>
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPriority(p.key)}
                className={`rounded-md border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                  priority === p.key
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm dark:border-orange-500 dark:bg-orange-600"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t-2 border-gray-200 pt-3 dark:border-gray-800 sm:gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={loading || !title.trim()}
            onClick={submit}
            loading={loading}
            className="!border-orange-600 !bg-orange-600 hover:!border-orange-700 hover:!bg-orange-700 dark:!border-orange-500 dark:!bg-orange-600 dark:hover:!border-orange-400 dark:hover:!bg-orange-500"
          >
            {initialTask ? "Kaydet" : "Ekle"}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default PersonalTaskModal;

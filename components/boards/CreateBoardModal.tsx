"use client";

import { memo, useCallback, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { BoardInput } from "@/interfaces/Board.interface";

interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: BoardInput) => Promise<void>;
  loading?: boolean;
}

const BOARD_COLORS = [
  { value: "#3B82F6", label: "Mavi" },
  { value: "#10B981", label: "Yeşil" },
  { value: "#F59E0B", label: "Turuncu" },
  { value: "#EF4444", label: "Kırmızı" },
  { value: "#8B5CF6", label: "Mor" },
  { value: "#EC4899", label: "Pembe" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#84CC16", label: "Lime" },
];

const BOARD_ICONS = [
  "📋",
  "📝",
  "✅",
  "🎯",
  "💡",
  "🚀",
  "⭐",
  "🔥",
  "📌",
  "🗂️",
];

const CreateBoardModal = memo(function CreateBoardModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: CreateBoardModalProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>(BOARD_COLORS[0].value);
  const [icon, setIcon] = useState<string>(BOARD_ICONS[0]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!name.trim()) return;

      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
      });

      // Form'u temizle
      setName("");
      setDescription("");
      setColor(BOARD_COLORS[0].value);
      setIcon(BOARD_ICONS[0]);
    },
    [name, description, color, icon, onSubmit]
  );

  const handleClose = useCallback(() => {
    if (loading) return;
    setName("");
    setDescription("");
    setColor(BOARD_COLORS[0].value);
    setIcon(BOARD_ICONS[0]);
    onClose();
  }, [loading, onClose]);

  const isFormValid = name.trim().length >= 1;

  return (
    <Modal open={open} title="Yeni Board Oluştur" onClose={handleClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="board-name"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Board Adı
          </label>
          <input
            id="board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: İş Projeleri"
            maxLength={50}
            required
            disabled={loading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {name.length}/50
          </p>
        </div>

        <div>
          <label
            htmlFor="board-desc"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Açıklama (Opsiyonel)
          </label>
          <textarea
            id="board-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Board hakkında kısa bir açıklama..."
            rows={2}
            maxLength={200}
            disabled={loading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description.length}/200
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Renk
          </label>
          <div className="flex flex-wrap gap-2">
            {BOARD_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                disabled={loading}
                className={`h-10 w-10 rounded-full transition ${
                  color === c.value
                    ? "ring-2 ring-gray-900 ring-offset-2 dark:ring-white"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {BOARD_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                disabled={loading}
                className={`flex h-10 w-10 items-center justify-center rounded-md text-xl transition ${
                  icon === ic
                    ? "bg-gray-200 dark:bg-gray-700"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {loading ? "Oluşturuluyor..." : "Oluştur"}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default CreateBoardModal;


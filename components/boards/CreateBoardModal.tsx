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
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Renk Seçin
          </label>
          <div className="grid grid-cols-4 gap-3">
            {BOARD_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                disabled={loading}
                className={`group relative h-12 w-full rounded-xl transition-all ${
                  color === c.value
                    ? "ring-2 ring-offset-2 scale-105 shadow-lg"
                    : "hover:scale-105 hover:shadow-md"
                }`}
                style={{
                  backgroundColor: c.value,
                  ringColor: color === c.value ? c.value : undefined,
                }}
                title={c.label}
              >
                {color === c.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Icon Seçin
          </label>
          <div className="grid grid-cols-5 gap-2">
            {BOARD_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                disabled={loading}
                className={`flex h-12 w-full items-center justify-center rounded-xl text-2xl transition-all ${
                  icon === ic
                    ? "bg-gradient-to-br from-blue-100 to-purple-100 ring-2 ring-blue-500 scale-105 shadow-md dark:from-blue-900/30 dark:to-purple-900/30 dark:ring-blue-400"
                    : "bg-gray-100 hover:bg-gray-200 hover:scale-105 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-60 disabled:hover:shadow-lg"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Oluşturuluyor...
              </span>
            ) : (
              "Oluştur"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default CreateBoardModal;


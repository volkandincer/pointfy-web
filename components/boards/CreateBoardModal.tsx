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
            className="w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
            className="w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                className={`group relative h-12 w-full border-2 transition-all ${
                  color === c.value
                    ? "border-gray-900 scale-105"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={{
                  backgroundColor: c.value,
                  ...(color === c.value && {
                    "--tw-ring-color": c.value,
                  } as React.CSSProperties),
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
                className={`flex h-12 w-full items-center justify-center border-2 text-2xl transition-all ${
                  icon === ic
                    ? "border-blue-600 bg-blue-50 scale-105 dark:bg-blue-900/20"
                    : "border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
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
            className="flex-1 border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="flex-1 border-2 border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 hover:border-blue-700 disabled:opacity-60"
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


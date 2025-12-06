"use client";

import { memo, startTransition, useCallback, useEffect, useState } from "react";
import { ClipboardList, FileText, CheckSquare, Target, Lightbulb, Rocket, Star, Flame, Pin, Folder, Check, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Board, BoardInput } from "@/interfaces/Board.interface";

interface EditBoardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, input: BoardInput) => Promise<void>;
  board: Board | null;
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
  { icon: ClipboardList, label: "Clipboard" },
  { icon: FileText, label: "File" },
  { icon: CheckSquare, label: "Check" },
  { icon: Target, label: "Target" },
  { icon: Lightbulb, label: "Lightbulb" },
  { icon: Rocket, label: "Rocket" },
  { icon: Star, label: "Star" },
  { icon: Flame, label: "Flame" },
  { icon: Pin, label: "Pin" },
  { icon: Folder, label: "Folder" },
];

const EditBoardModal = memo(function EditBoardModal({
  open,
  onClose,
  onSubmit,
  board,
  loading = false,
}: EditBoardModalProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>(BOARD_COLORS[0].value);
  const [icon, setIcon] = useState<typeof BOARD_ICONS[0]>(BOARD_ICONS[0]);

  useEffect(() => {
    if (!board) {
      return;
    }

    startTransition(() => {
      setName(board.name);
      setDescription(board.description || "");
      setColor(board.color || BOARD_COLORS[0].value);
      const iconMatch = BOARD_ICONS.find(ic => ic.label.toLowerCase() === board.icon?.toLowerCase()) || BOARD_ICONS[0];
      setIcon(iconMatch);
    });
  }, [board]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!name.trim() || !board) return;

      await onSubmit(board.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon: icon.label.toLowerCase(),
      });
    },
    [name, description, color, icon, board, onSubmit]
  );

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  const isFormValid = name.trim().length >= 1 && board !== null;

  return (
    <Modal open={open} title="Board Düzenle" onClose={handleClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="edit-board-name"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Board Adı
          </label>
          <input
            id="edit-board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: İş Projeleri"
            maxLength={50}
            required
            disabled={loading}
            className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {name.length}/50
          </p>
        </div>

        <div>
          <label
            htmlFor="edit-board-desc"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Açıklama (Opsiyonel)
          </label>
          <textarea
            id="edit-board-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Board hakkında kısa bir açıklama..."
            rows={2}
            maxLength={200}
            disabled={loading}
            className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-500"
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
                    ? "border-gray-900 shadow-md"
                    : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
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
                    <Check className="h-6 w-6 text-white" strokeWidth={3} />
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
            {BOARD_ICONS.map((ic) => {
              const IconComponent = ic.icon;
              return (
                <button
                  key={ic.label}
                  type="button"
                  onClick={() => setIcon(ic)}
                  disabled={loading}
                  className={`flex h-12 w-full items-center justify-center border-2 transition-all ${
                    icon === ic
                      ? "border-blue-600 bg-blue-50 shadow-sm dark:bg-blue-900/20"
                      : "border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
                >
                  <IconComponent className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-md border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </span>
            ) : (
              "Kaydet"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default EditBoardModal;


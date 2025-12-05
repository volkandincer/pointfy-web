"use client";

import { memo, useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { useToastContext } from "@/contexts/ToastContext";
import type { RetroCategory } from "@/interfaces/Retro.interface";

interface RetroCardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (category: RetroCategory, content: string) => Promise<void>;
  initialCategory?: RetroCategory;
  initialContent?: string;
  isEdit?: boolean;
}

const getCategoryInfo = (category: RetroCategory) => {
  switch (category) {
    case "mad":
      return { title: "Mad 😠", color: "red", emoji: "😠" };
    case "sad":
      return { title: "Sad 😢", color: "blue", emoji: "😢" };
    case "glad":
      return { title: "Glad 😊", color: "green", emoji: "😊" };
  }
};

const RetroCardModal = memo(function RetroCardModal({
  open,
  onClose,
  onSubmit,
  initialCategory = "glad",
  initialContent = "",
  isEdit = false,
}: RetroCardModalProps) {
  const { showToast } = useToastContext();
  const [category, setCategory] = useState<RetroCategory>(initialCategory);
  const [content, setContent] = useState<string>(initialContent);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setCategory(initialCategory);
      setContent(initialContent);
    }
  }, [open, initialCategory, initialContent]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!content.trim()) {
        showToast("Lütfen kart içeriğini girin.", "error");
        return;
      }
      setLoading(true);
      try {
        await onSubmit(category, content);
        setContent("");
        onClose();
        showToast(
          isEdit ? "✅ Kart başarıyla güncellendi!" : "✅ Kart başarıyla eklendi!",
          "success"
        );
      } catch (err) {
        showToast("Kart kaydedilirken bir hata oluştu.", "error");
      } finally {
        setLoading(false);
      }
    },
    [category, content, onSubmit, onClose, isEdit, showToast]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Kartı Düzenle" : "Yeni Kart Ekle"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector */}
        <div className="flex gap-2">
          {(["mad", "sad", "glad"] as RetroCategory[]).map((cat) => {
            const info = getCategoryInfo(cat);
            const isSelected = category === cat;
            const bgColorClass =
              info.color === "red"
                ? "bg-red-600"
                : info.color === "blue"
                ? "bg-blue-600"
                : "bg-green-600";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-1 border-2 px-3 py-2 font-semibold transition-colors ${
                  isSelected
                    ? `${bgColorClass} border-transparent text-white`
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <span className="mr-1">{info.emoji}</span>
                {info.title.split(" ")[0]}
              </button>
            );
          })}
        </div>

        {/* Content Input */}
        <div>
          <label
            htmlFor="retro-content"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Kart İçeriği
          </label>
          <textarea
            id="retro-content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Kartınızı yazın..."
            required
            className="w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center border-2 border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex h-10 items-center justify-center border-2 border-indigo-600 bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 hover:border-indigo-700 disabled:opacity-60"
          >
            {loading
              ? isEdit
                ? "Kaydediliyor..."
                : "Ekleniyor..."
              : isEdit
              ? "Kaydet"
              : "Ekle"}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default RetroCardModal;

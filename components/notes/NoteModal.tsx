"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Tag, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Note, NoteInput } from "@/interfaces/Note.interface";

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NoteInput, noteId?: string) => Promise<void>;
  initialNote?: Note;
}

const CATEGORIES = [
  { label: "Kişisel", value: "personal" },
  { label: "İş", value: "work" },
  { label: "Fikir", value: "ideas" },
  { label: "Yapılacaklar", value: "todo" },
  { label: "Önemli", value: "important" },
  { label: "Genel", value: "general" },
  { label: "Özel...", value: "custom" },
] as const;

const NoteModal = memo(function NoteModal({
  open,
  onClose,
  onSubmit,
  initialNote,
}: NoteModalProps) {
  const [content, setContent] = useState<string>("");
  const [category, setCategory] = useState<string>("general");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const categories = useMemo(() => CATEGORIES, []);

  useEffect(() => {
    if (open) {
      setContent(initialNote?.content || "");
      const noteCategory = initialNote?.category || "";
      const validCategories = categories.map((c) => c.value);
      if (
        noteCategory &&
        validCategories.includes(
          noteCategory as (typeof validCategories)[number]
        )
      ) {
        setCategory(noteCategory);
        setCustomCategory("");
      } else if (noteCategory) {
        setCategory("custom");
        setCustomCategory(noteCategory);
      } else {
        setCategory("general");
        setCustomCategory("");
      }
    }
  }, [initialNote, open, categories]);

  const getSelectedCategory = useCallback(() => {
    if (category === "custom") {
      return customCategory.trim();
    }
    return category || "general";
  }, [category, customCategory]);

  const submit = useCallback(async () => {
    const selectedCategory = getSelectedCategory();
    if (!content.trim() || !selectedCategory) return;
    setLoading(true);
    try {
      await onSubmit(
        {
          content: content.trim(),
          category: selectedCategory,
        },
        initialNote?.id
      );
      setContent("");
      setCategory("general");
      setCustomCategory("");
      onClose();
    } catch (error) {
      // Error submitting note
    } finally {
      setLoading(false);
    }
  }, [content, getSelectedCategory, onClose, onSubmit, initialNote?.id]);

  const isFormValid = content.trim().length > 0 && getSelectedCategory().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
            <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <span className="font-bold">{initialNote ? "Notu Düzenle" : "Hızlı Not Ekle"}</span>
        </div>
      }
      className="sm:border-yellow-600/30 dark:sm:border-yellow-500/30"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Content Input */}
        <div>
          <label
            htmlFor="note-content"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 sm:h-6 sm:w-6">
              <FileText className="h-3 w-3 text-yellow-600 dark:text-yellow-400 sm:h-4 sm:w-4" />
            </div>
            Not İçeriği <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <textarea
            id="note-content"
            placeholder="Notunuzu buraya yazın..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            disabled={loading}
            autoFocus
            className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-yellow-400 sm:px-4 sm:py-3 sm:text-base"
          />
          <div className="mt-1.5 flex items-center justify-between sm:mt-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
              Minimum 1 karakter gerekli
            </p>
            <p className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 sm:text-xs">
              {content.length}/500
            </p>
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white sm:mb-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 sm:h-6 sm:w-6">
              <Tag className="h-3 w-3 text-yellow-600 dark:text-yellow-400 sm:h-4 sm:w-4" />
            </div>
            Kategori <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setCategory(cat.value);
                  if (cat.value !== "custom") {
                    setCustomCategory("");
                  }
                }}
                disabled={loading}
                className={`rounded-md border-2 px-3 py-2.5 text-xs font-semibold transition-all sm:px-3 sm:py-2 sm:text-sm ${
                  category === cat.value
                    ? "border-yellow-600 bg-yellow-600 text-white shadow-sm hover:border-yellow-700 hover:bg-yellow-700 dark:border-yellow-500 dark:bg-yellow-600 dark:hover:border-yellow-400 dark:hover:bg-yellow-500"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                } disabled:opacity-50`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {category === "custom" && (
            <div className="mt-2 sm:mt-3">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Özel kategori adı..."
                maxLength={20}
                disabled={loading}
                autoFocus
                className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-yellow-400"
              />
              <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                Özel kategori adınızı yazın (max 20 karakter)
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t-2 border-gray-200 pt-3 sm:gap-3 sm:pt-4 dark:border-gray-800">
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
            disabled={!isFormValid || loading}
            onClick={submit}
            loading={loading}
            className="border-yellow-600 bg-yellow-600 hover:border-yellow-700 hover:bg-yellow-700 dark:border-yellow-500 dark:bg-yellow-600 dark:hover:border-yellow-400 dark:hover:bg-yellow-500"
          >
            {loading ? "Kaydediliyor..." : initialNote ? "Kaydet" : "Kaydet"}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default NoteModal;

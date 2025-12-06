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
      title={initialNote ? "Notu Düzenle" : "Hızlı Not Ekle"}
    >
      <div className="space-y-6">
        {/* Content Input */}
        <div>
          <label
            htmlFor="note-content"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white"
          >
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Not İçeriği <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <textarea
            id="note-content"
            placeholder="Notunuzu yazın..."
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            disabled={loading}
            autoFocus
            className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Minimum 1 karakter gerekli
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {content.length}/500
            </p>
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Kategori <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
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
                className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  category === cat.value
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                } disabled:opacity-50`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {category === "custom" && (
            <div className="mt-3">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Özel kategori adı..."
                maxLength={20}
                disabled={loading}
                autoFocus
                className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Özel kategori adınızı yazın (max 20 karakter)
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t-2 border-gray-200 pt-4 dark:border-gray-800">
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
          >
            {loading ? "Kaydediliyor..." : initialNote ? "Kaydet" : "Kaydet"}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default NoteModal;

"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Note, NoteInput } from "@/interfaces/Note.interface";

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NoteInput, noteId?: string) => Promise<void>;
  initialNote?: Note;
}

// Mobil projedeki kategorileri Supabase constraint'ine uyarlıyoruz
// Constraint: 'general', 'work', 'personal', 'ideas', 'todo', 'important'
// Tabloda değişiklik yapmayacağımız için sadece constraint'teki kategorilere izin veriyoruz
const CATEGORIES = [
  { label: "Kişisel", value: "personal" },
  { label: "İş", value: "work" },
  { label: "Fikir", value: "ideas" },
  { label: "Yapılacaklar", value: "todo" },
  { label: "Önemli", value: "important" },
  { label: "Genel", value: "general" },
] as const;

const NoteModal = memo(function NoteModal({
  open,
  onClose,
  onSubmit,
  initialNote,
}: NoteModalProps) {
  const [content, setContent] = useState<string>("");
  const [category, setCategory] = useState<string>("general");
  const [loading, setLoading] = useState<boolean>(false);
  const [inputFocused, setInputFocused] = useState<boolean>(false);

  const categories = useMemo(() => CATEGORIES, []);

  useEffect(() => {
    if (open) {
      setContent(initialNote?.content || "");
      // Kategori değerini kontrol et, eğer constraint'te yoksa 'general' yap
      const noteCategory = initialNote?.category || "";
      const validCategories = categories.map((c) => c.value);
      if (noteCategory && validCategories.includes(noteCategory as typeof validCategories[number])) {
        setCategory(noteCategory);
      } else {
        setCategory("general");
      }
      setInputFocused(false);
    }
  }, [initialNote, open, categories]);

  const getSelectedCategory = useCallback(() => {
    // Constraint'teki kategorilerden birini döndür
    return category || "general";
  }, [category]);

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
      onClose();
    } catch (error) {
      console.error("Error submitting note:", error);
    } finally {
      setLoading(false);
    }
  }, [content, getSelectedCategory, onClose, onSubmit, initialNote?.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialNote ? "Notu Düzenle" : "Hızlı Not Ekle"}
    >
      <div className="space-y-5">
        <div>
          <textarea
            placeholder="Notunuzu yazın..."
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            maxLength={500}
            disabled={loading}
            autoFocus
            className={`w-full rounded-2xl border-2 px-4 py-4 text-base transition ${
              inputFocused
                ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-gray-800"
                : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            } text-gray-900 outline-none dark:text-white`}
          />
        </div>

        <div>
          <label className="mb-3 block text-base font-semibold text-gray-700 dark:text-gray-300">
            Kategori
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                disabled={loading}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === cat.value
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>


        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-base font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={loading || !content.trim() || !getSelectedCategory()}
            onClick={submit}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Kaydediliyor..." : initialNote ? "Kaydet" : "Kaydet"}
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default NoteModal;

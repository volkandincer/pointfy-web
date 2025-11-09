"use client";

import { memo } from "react";
import type { Note } from "@/interfaces/Note.interface";

interface NoteListProps {
  notes: Note[];
  onDelete: (noteId: string) => Promise<void>;
  onEdit: (note: Note) => void;
}

// Kategori label mapping (Supabase değerlerini Türkçe label'lara çevir)
const CATEGORY_LABELS: Record<string, string> = {
  personal: "Kişisel",
  work: "İş",
  ideas: "Fikir",
  todo: "Yapılacaklar",
  important: "Önemli",
  general: "Genel",
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

function getChipColor(category: string, isDark: boolean = false): string {
  if (category === "Tümü") return isDark ? "#23272f" : "#e0e7ff";
  const palette = [
    "#e57373", // kırmızı
    "#64b5f6", // mavi
    "#81c784", // yeşil
    "#ffd54f", // sarı
    "#ba68c8", // mor
    "#ffb74d", // turuncu
    "#4dd0e1", // camgöbeği
  ];
  const idx =
    Math.abs(
      category.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % palette.length;
  return palette[idx];
}

function getChipTextColor(category: string, isDark: boolean = false): string {
  if (category === "Tümü") return isDark ? "#b0bec5" : "#3730a3";
  return "#23272f";
}

function formatDate(dateValue: string | number): string {
  const date = new Date(dateValue);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const NoteList = memo(function NoteList({
  notes,
  onDelete,
  onEdit,
}: NoteListProps) {
  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const chipColor = getChipColor(note.category);
        const chipTextColor = getChipTextColor(note.category);
        const dateValue = note.createdAt || note.created_at || Date.now();

        return (
          <div
            key={note.id}
            onClick={() => onEdit(note)}
            className="group cursor-pointer rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800/70 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: chipColor,
                  color: chipTextColor,
                }}
              >
                {getCategoryLabel(note.category)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
              >
                Sil
              </button>
            </div>
            <p className="mb-3 min-h-[3rem] text-base font-semibold text-gray-900 dark:text-white">
              {note.content}
            </p>
            <div className="flex items-center justify-end">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatDate(dateValue)}
              </p>
            </div>
          </div>
        );
      })}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-5xl opacity-80">📝</div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Henüz hiç notunuz yok.
          </p>
          <p className="mt-2 max-w-[260px] text-sm text-gray-500 dark:text-gray-400">
            Not ekleyip toplantı öncesi hazırlık yapabilirsin.
          </p>
        </div>
      )}
    </div>
  );
});

export default NoteList;

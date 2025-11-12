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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  personal: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-300 dark:border-pink-700",
  },
  work: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-700",
  },
  ideas: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-300 dark:border-purple-700",
  },
  todo: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-300 dark:border-yellow-700",
  },
  important: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-700",
  },
  general: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
  },
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
}

function formatDate(dateValue: string | number | undefined): string {
  if (!dateValue) return "Tarih yok";
  const date = new Date(dateValue);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateValue: string | number | undefined): string {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const NoteList = memo(function NoteList({
  notes,
  onDelete,
  onEdit,
}: NoteListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => {
        const categoryStyle = getCategoryStyle(note.category);
        const dateValue = note.createdAt || note.created_at;
        const updatedValue = note.updated_at;
        const isUpdated = updatedValue && updatedValue !== note.created_at;

        return (
          <div
            key={note.id}
            className="group relative overflow-hidden rounded-2xl border-2 border-gray-200/70 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg dark:border-gray-800/70 dark:bg-gray-900 dark:hover:border-gray-700"
          >
            {/* Category Indicator Bar */}
            <div
              className={`absolute left-0 top-0 h-1 w-full ${categoryStyle.bg}`}
            />

            {/* Content */}
            <div className="relative">
              {/* Header */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                  >
                    {getCategoryLabel(note.category)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Bu notu silmek istediğinize emin misiniz?")) {
                        onDelete(note.id);
                      }
                    }}
                    className="rounded-lg bg-red-50 p-1.5 text-red-600 transition-all hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    title="Sil"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <p
                  onClick={() => onEdit(note)}
                  className="min-h-[4rem] cursor-pointer text-base leading-relaxed text-gray-900 dark:text-white"
                >
                  {note.content}
                </p>
              </div>

              {/* Info Section */}
              <div className="mb-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                {/* Created Date */}
                {dateValue && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Oluşturuldu: {formatDate(dateValue)}</span>
                    {formatTime(dateValue) && (
                      <span className="text-gray-400">• {formatTime(dateValue)}</span>
                    )}
                  </div>
                )}

                {/* Updated Date */}
                {isUpdated && updatedValue && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Güncellendi: {formatDate(updatedValue)}</span>
                    {formatTime(updatedValue) && (
                      <span className="text-gray-400">• {formatTime(updatedValue)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onEdit(note)}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-700 hover:to-purple-800 hover:shadow-lg"
              >
                <svg
                  className="mr-2 inline h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Düzenle
              </button>
            </div>
          </div>
        );
      })}
      {notes.length === 0 && (
        <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
            <svg
              className="h-8 w-8 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Henüz not yok
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            İlk notunuzu ekleyerek başlayın
          </p>
        </div>
      )}
    </div>
  );
});

export default NoteList;

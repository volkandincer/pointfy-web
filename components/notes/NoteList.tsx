"use client";

import { memo } from "react";
import { Trash2, Edit, Calendar, RefreshCw, FileText } from "lucide-react";
import EmptyState from "@/components/jira/EmptyState";
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; borderColor: string }> = {
  personal: {
    bg: "bg-pink-50 dark:bg-pink-900/20",
    text: "text-pink-700 dark:text-pink-400",
    borderColor: "#ec4899",
  },
  work: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    borderColor: "#2563eb",
  },
  ideas: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-400",
    borderColor: "#9333ea",
  },
  todo: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-400",
    borderColor: "#eab308",
  },
  important: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    borderColor: "#dc2626",
  },
  general: {
    bg: "bg-gray-50 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    borderColor: "#6b7280",
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
            className="group relative border-l-4 border-t border-r border-b border-gray-300 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            style={{
              borderLeftColor: categoryStyle.borderColor,
            }}
          >

            {/* Content */}
            <div className="relative">
              {/* Header */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={`border-2 px-3 py-1 text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.text}`}
                    style={{
                      borderColor: categoryStyle.borderColor,
                    }}
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
                    className="border border-red-600 bg-white p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:bg-gray-900 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/20"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
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
              <div className="mb-4 space-y-2 border-t border-gray-300 pt-4 dark:border-gray-700">
                {/* Created Date */}
                {dateValue && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Oluşturuldu: {formatDate(dateValue)}</span>
                    {formatTime(dateValue) && (
                      <span className="text-gray-400">• {formatTime(dateValue)}</span>
                    )}
                  </div>
                )}

                {/* Updated Date */}
                {isUpdated && updatedValue && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <RefreshCw className="h-3.5 w-3.5" />
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
                className="w-full inline-flex items-center justify-center gap-2 border-2 border-purple-600 bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 hover:border-purple-700"
              >
                <Edit className="h-4 w-4" />
                Düzenle
              </button>
            </div>
          </div>
        );
      })}
      {notes.length === 0 && (
        <div className="col-span-full">
          <EmptyState
            icon={FileText}
            title="Henüz not yok"
            description="İlk notunuzu ekleyerek başlayın"
          />
        </div>
      )}
    </div>
  );
});

export default NoteList;

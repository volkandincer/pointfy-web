"use client";

import { memo } from "react";
import { Trash2, Edit, Calendar, RefreshCw, FileText, MoreVertical } from "lucide-react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/jira/EmptyState";
import type { Note } from "@/interfaces/Note.interface";

interface NoteListProps {
  notes: Note[];
  onDelete: (noteId: string) => Promise<void>;
  onEdit: (note: Note) => void;
  onCreateNew?: () => void;
}

// Kategori label mapping
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
    bg: "bg-pink-50 dark:bg-pink-900/20",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-300 dark:border-pink-700",
  },
  work: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-700",
  },
  ideas: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-300 dark:border-purple-700",
  },
  todo: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-300 dark:border-yellow-700",
  },
  important: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-700",
  },
  general: {
    bg: "bg-gray-50 dark:bg-gray-800",
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
  onCreateNew,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Henüz not yok"
        description="İlk notunuzu ekleyerek başlayın"
        actionLabel={onCreateNew ? "Yeni Not Ekle" : undefined}
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 sm:gap-4">
      {notes.map((note) => {
        const categoryStyle = getCategoryStyle(note.category);
        const dateValue = note.createdAt || note.created_at;
        const updatedValue = note.updated_at;
        const isUpdated = updatedValue && updatedValue !== note.created_at;

        return (
          <div
            key={note.id}
            className="group relative flex flex-col border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            style={{
              borderLeftColor: categoryStyle.border.includes('yellow') ? '#eab308' : categoryStyle.border.includes('purple') ? '#a855f7' : categoryStyle.border.includes('blue') ? '#2563eb' : categoryStyle.border.includes('green') ? '#16a34a' : categoryStyle.border.includes('red') ? '#dc2626' : categoryStyle.border.includes('orange') ? '#f97316' : categoryStyle.border.includes('pink') ? '#ec4899' : '#6b7280',
            }}
          >
            {/* Header - Category Badge & Actions */}
            <div className="mb-3 flex items-start justify-between gap-2">
              <span
                className={`border-2 px-2.5 py-1 text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
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
                className="rounded-md border-2 border-transparent p-1.5 text-gray-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div
              onClick={() => onEdit(note)}
              className="mb-4 flex-1 cursor-pointer"
            >
              <p className="line-clamp-4 text-sm leading-relaxed text-gray-900 dark:text-white">
                {note.content}
              </p>
            </div>

            {/* Footer - Date & Edit Button */}
            <div className="mt-auto space-y-3 border-t-2 border-gray-100 pt-3 dark:border-gray-800">
              {/* Date Info */}
              <div className="space-y-1.5">
                {dateValue && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(dateValue)}</span>
                    {formatTime(dateValue) && (
                      <span className="text-gray-400">• {formatTime(dateValue)}</span>
                    )}
                  </div>
                )}
                {isUpdated && updatedValue && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Güncellendi: {formatDate(updatedValue)}</span>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => onEdit(note)}
                icon={Edit}
              >
                Düzenle
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default NoteList;

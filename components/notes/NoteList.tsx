"use client";

import { memo } from "react";
import { Trash2, Edit, Calendar, RefreshCw, FileText } from "lucide-react";
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

  // Kategori renklerini al (task card'larındaki gibi)
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { border: string; bg: string; borderDark: string }> = {
      personal: { border: "#ec4899", bg: "#fce7f3", borderDark: "#db2777" }, // pink
      work: { border: "#2563eb", bg: "#dbeafe", borderDark: "#1d4ed8" }, // blue
      ideas: { border: "#a855f7", bg: "#f3e8ff", borderDark: "#9333ea" }, // purple
      todo: { border: "#eab308", bg: "#fef9c3", borderDark: "#ca8a04" }, // yellow
      important: { border: "#dc2626", bg: "#fee2e2", borderDark: "#b91c1c" }, // red
      general: { border: "#6b7280", bg: "#f3f4f6", borderDark: "#4b5563" }, // gray
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => {
        const cardColor = getCategoryColor(note.category);
        const dateValue = note.createdAt || note.created_at;
        const updatedValue = note.updated_at;
        const isUpdated = updatedValue && updatedValue !== note.created_at;

        return (
          <div
            key={note.id}
            onClick={() => onEdit(note)}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white p-4 transition-all hover:border-gray-400 hover:shadow-md cursor-pointer dark:border-gray-700 dark:bg-gray-900"
            style={{
              borderColor: cardColor.border,
            }}
          >
            {/* Top Color Bar */}
            <div
              className="absolute left-0 top-0 h-1 w-full"
              style={{ backgroundColor: cardColor.border }}
            />

            {/* Header - Category Badge */}
            <div className="relative mb-2">
              <span
                className="rounded border px-2 py-0.5 text-xs font-medium"
                style={{
                  borderColor: cardColor.border,
                  backgroundColor: `${cardColor.border}15`,
                  color: cardColor.border,
                }}
              >
                {getCategoryLabel(note.category)}
              </span>
            </div>

            {/* Content */}
            <div className="relative mb-3 flex-1 min-h-[50px]">
              <p className="line-clamp-4 text-sm leading-relaxed text-gray-900 dark:text-white">
                {note.content}
              </p>
            </div>

            {/* Footer - Date & Action Buttons */}
            <div className="relative mt-auto flex items-center gap-2 border-t pt-2.5" style={{ borderTopColor: `${cardColor.border}30` }}>
              <div className="flex flex-1 items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(dateValue)}</span>
                {isUpdated && updatedValue && (
                  <>
                    <span className="text-gray-400">•</span>
                    <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                  </>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors hover:bg-white/10"
                style={{
                  borderColor: `${cardColor.border}80`,
                  color: cardColor.border,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cardColor.border;
                  e.currentTarget.style.backgroundColor = `${cardColor.border}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${cardColor.border}80`;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Düzenle"
              >
                <Edit className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Bu notu silmek istediğinize emin misiniz?")) {
                    onDelete(note.id);
                  }
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-red-400 text-red-400 transition-colors hover:bg-red-400/10 dark:border-red-500 dark:text-red-500"
                title="Sil"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default NoteList;

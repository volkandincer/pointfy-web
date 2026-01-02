"use client";

import { memo } from "react";
import {
  Trash2,
  Edit,
  Calendar,
  RefreshCw,
  FileText,
} from "lucide-react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
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

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
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
    bg: "bg-muted",
    text: "text-card-foreground",
    border: "border-border",
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

        // Get border color class based on category
        const getBorderColorClass = (borderClass: string): string => {
          if (borderClass.includes("yellow"))
            return "border-l-yellow-600 dark:border-l-yellow-500";
          if (borderClass.includes("purple"))
            return "border-l-purple-600 dark:border-l-purple-500";
          if (borderClass.includes("blue"))
            return "border-l-blue-600 dark:border-l-blue-500";
          if (borderClass.includes("green"))
            return "border-l-green-600 dark:border-l-green-500";
          if (borderClass.includes("red"))
            return "border-l-red-600 dark:border-l-red-500";
          if (borderClass.includes("orange"))
            return "border-l-orange-600 dark:border-l-orange-500";
          if (borderClass.includes("pink"))
            return "border-l-pink-600 dark:border-l-pink-500";
          return "border-l-primary dark:border-l-primary";
        };

        const borderColorClass = getBorderColorClass(categoryStyle.border);

        return (
          <div
            key={note.id}
            className={`group relative flex min-h-[180px] flex-col overflow-hidden rounded-lg border-l-4 ${borderColorClass} border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl`}
          >
            {/* Glow Effect */}
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col">
              {/* Header - Category Badge & Actions */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <span
                  className={`rounded-md border-2 px-2.5 py-1 text-xs font-semibold shadow-sm ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
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
                  className="rounded-lg border-2 border-transparent p-1.5 text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div
                onClick={() => onEdit(note)}
                className="mb-3 flex-1 cursor-pointer"
              >
                <p className="line-clamp-4 text-sm leading-relaxed text-card-foreground">
                  {note.content}
                </p>
              </div>

              {/* Footer - Date & Edit Button */}
              <div className="mt-auto space-y-2.5 border-t-2 border-border pt-3">
                {/* Date Info */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatDate(dateValue)}</span>
                  {formatTime(dateValue) && (
                    <span className="text-muted-foreground/70">
                      • {formatTime(dateValue)}
                    </span>
                  )}
                  {isUpdated && updatedValue && (
                    <>
                      <span className="text-muted-foreground/70">•</span>
                      <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                      <span>Güncellendi</span>
                    </>
                  )}
                </div>

                {/* Edit Button */}
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => onEdit(note)}
                  icon={Edit}
                  className="border-primary text-primary hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  Düzenle
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default NoteList;

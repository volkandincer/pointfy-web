"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { Edit, Archive, ArchiveRestore, Trash2, ClipboardList } from "lucide-react";
import type { Board } from "@/interfaces/Board.interface";

interface BoardCardProps {
  board: Board;
  onEdit?: (board: Board) => void;
  onDelete?: (board: Board) => void;
  onArchive?: (board: Board, archived: boolean) => void;
}

const BoardCard = memo(function BoardCard({
  board,
  onEdit,
  onDelete,
  onArchive,
}: BoardCardProps) {
  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onEdit?.(board);
    },
    [board, onEdit]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(`"${board.name}" board'unu silmek istediğinize emin misiniz?`)) {
        onDelete?.(board);
      }
    },
    [board, onDelete]
  );

  const handleArchive = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onArchive?.(board, !board.is_archived);
    },
    [board, onArchive]
  );

  // Board renk paleti - eğer board'un kendi rengi yoksa, ID'ye göre renk atanır
  const boardColorPalette = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#84CC16", // Lime
    "#6366F1", // Indigo
  ];

  // Board ID'sine göre renk seç (eğer board'un kendi rengi yoksa)
  const getBoardColor = () => {
    if (board.color) return board.color;
    
    // Board ID'sinin son karakterini al ve renk paletinden seç
    const lastChar = board.id.slice(-1);
    const colorIndex = parseInt(lastChar, 16) % boardColorPalette.length;
    return boardColorPalette[colorIndex];
  };

  const boardColor = getBoardColor();

  // Renk için opacity değerleri
  const getColorWithOpacity = (color: string, opacity: number) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Determine border color class based on board color
  const getBorderColorClass = () => {
    // Map hex colors to Tailwind classes (approximate)
    const colorMap: Record<string, string> = {
      "#3B82F6": "border-l-blue-600 dark:border-l-blue-500",
      "#10B981": "border-l-green-600 dark:border-l-green-500",
      "#F59E0B": "border-l-amber-600 dark:border-l-amber-500",
      "#EF4444": "border-l-red-600 dark:border-l-red-500",
      "#8B5CF6": "border-l-purple-600 dark:border-l-purple-500",
      "#EC4899": "border-l-pink-600 dark:border-l-pink-500",
      "#06B6D4": "border-l-cyan-600 dark:border-l-cyan-500",
      "#F97316": "border-l-orange-600 dark:border-l-orange-500",
      "#84CC16": "border-l-lime-600 dark:border-l-lime-500",
      "#6366F1": "border-l-indigo-600 dark:border-l-indigo-500",
    };
    return colorMap[boardColor] || "border-l-primary dark:border-l-primary";
  };

  const borderColorClass = getBorderColorClass();

  return (
    <Link
      href={`/app/boards/${board.id}`}
      className={`group relative flex min-h-[140px] flex-col overflow-hidden rounded-lg border-l-4 ${borderColorClass} border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl`}
    >
      {/* Glow Effect */}
      <div 
        className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br blur-xl transition-all group-hover:scale-150"
        style={{
          background: `radial-gradient(circle, ${getColorWithOpacity(boardColor, 0.1)}, ${getColorWithOpacity(boardColor, 0.05)})`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Header */}
        <div className="relative mb-4">
          <div className="flex items-start gap-3 pr-20">
            {/* Icon Box */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-transparent transition-transform group-hover:scale-110 sm:h-14 sm:w-14"
              style={{
                background: `linear-gradient(to bottom right, ${getColorWithOpacity(boardColor, 0.2)}, transparent)`,
              }}
            >
              <ClipboardList 
                className="h-6 w-6 sm:h-7 sm:w-7"
                style={{ color: boardColor }}
              />
            </div>

            {/* Title and Description */}
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-lg font-bold text-card-foreground line-clamp-2 sm:mb-1.5 sm:text-xl">
                {board.name}
              </h3>
              {board.description && (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:line-clamp-3 sm:text-sm">
                  {board.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - Absolute positioned */}
          <div className="absolute right-0 top-0 z-20 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:gap-1.5">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-primary bg-card shadow-sm text-primary transition-all hover:border-primary hover:bg-primary/10 active:bg-primary/20 sm:h-10 sm:w-10"
                title="Düzenle"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {onArchive && (
              <button
                onClick={handleArchive}
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border bg-card shadow-sm text-muted-foreground transition-all hover:border-border hover:bg-accent active:bg-accent sm:h-10 sm:w-10"
                title={board.is_archived ? "Arşivden Çıkar" : "Arşivle"}
              >
                {board.is_archived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-destructive bg-card shadow-sm text-destructive transition-all hover:border-destructive hover:bg-destructive/10 active:bg-destructive/20 sm:h-10 sm:w-10"
                title="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Color Indicator */}
        <div className="mt-auto flex items-center gap-3">
          <div
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: boardColor }}
          />
          <div
            className="h-6 w-6 rounded-full border-2 border-border shadow-sm"
            style={{ backgroundColor: boardColor }}
          />
        </div>
      </div>
    </Link>
  );
});

export default BoardCard;


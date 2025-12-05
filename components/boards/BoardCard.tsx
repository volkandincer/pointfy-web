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

  const boardColor = board.color || "#3B82F6";

  // Renk için opacity değerleri
  const getColorWithOpacity = (color: string, opacity: number) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <Link
      href={`/app/boards/${board.id}`}
      className="group relative block border-l-4 border-t border-r border-b border-gray-300 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
      style={{
        borderLeftColor: boardColor,
      }}
    >

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="relative mb-4">
          <div className="flex items-start gap-3 pr-20">
            {/* Icon Box */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center border-2 bg-gray-50 transition-colors dark:bg-gray-800"
              style={{
                borderColor: boardColor,
              }}
            >
              <ClipboardList 
                className="h-6 w-6"
                style={{ color: boardColor }}
              />
            </div>

            {/* Title and Description */}
            <div className="min-w-0 flex-1">
              <h3 className="mb-1.5 text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                {board.name}
              </h3>
              {board.description && (
                <p className="line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {board.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - Absolute positioned */}
          <div className="absolute right-0 top-0 flex shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="border border-blue-600 bg-white p-2 text-blue-600 transition-colors hover:bg-blue-50 dark:bg-gray-900 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
                title="Düzenle"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {onArchive && (
              <button
                onClick={handleArchive}
                className="border border-gray-300 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
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
                className="border border-red-600 bg-white p-2 text-red-600 transition-colors hover:bg-red-50 dark:bg-gray-900 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
                title="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Color Indicator */}
        <div className="flex items-center gap-3">
          <div
            className="h-1 flex-1"
            style={{ backgroundColor: boardColor }}
          />
          <div
            className="h-6 w-6 border-2 border-gray-300 dark:border-gray-700"
            style={{ backgroundColor: boardColor }}
          />
        </div>
      </div>
    </Link>
  );
});

export default BoardCard;


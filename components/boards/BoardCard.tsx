"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
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
  const boardIcon = board.icon || "📋";

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
      className="group relative block overflow-hidden rounded-2xl border-2 border-gray-200/70 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl dark:border-gray-800/70 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      {/* Left Border with Board Color */}
      <div
        className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-1.5"
        style={{ backgroundColor: boardColor }}
      />

      {/* Gradient Background Overlay on Hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-5"
        style={{
          background: `linear-gradient(135deg, ${boardColor} 0%, ${getColorWithOpacity(boardColor, 0.5)} 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="relative mb-4">
          <div className="flex items-start gap-3 pr-20">
            {/* Icon Box */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg"
              style={{
                backgroundColor: getColorWithOpacity(boardColor, 0.15),
              }}
            >
              {boardIcon}
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
                className="rounded-lg bg-blue-50 p-2 text-blue-600 transition-all hover:bg-blue-100 hover:scale-110 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                title="Düzenle"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onArchive && (
              <button
                onClick={handleArchive}
                className="rounded-lg bg-gray-100 p-2 text-gray-600 transition-all hover:bg-gray-200 hover:scale-110 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                title={board.is_archived ? "Arşivden Çıkar" : "Arşivle"}
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
                    d={
                      board.is_archived
                        ? "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        : "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                    }
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-50 p-2 text-red-600 transition-all hover:bg-red-100 hover:scale-110 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
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
            )}
          </div>
        </div>

        {/* Bottom Color Indicator */}
        <div className="flex items-center gap-3">
          <div
            className="h-1.5 flex-1 rounded-full transition-all group-hover:h-2"
            style={{ backgroundColor: boardColor }}
          />
          <div
            className="h-6 w-6 rounded-full border-2 border-white shadow-sm dark:border-gray-800 transition-transform group-hover:scale-110"
            style={{ backgroundColor: boardColor }}
          />
        </div>
      </div>
    </Link>
  );
});

export default BoardCard;


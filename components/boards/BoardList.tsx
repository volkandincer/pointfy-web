"use client";

import { memo, useCallback, useMemo, useState } from "react";
import BoardCard from "./BoardCard";
import CreateBoardModal from "./CreateBoardModal";
import EditBoardModal from "./EditBoardModal";
import { useBoards } from "@/hooks/useBoards";
import type { Board, BoardInput } from "@/interfaces/Board.interface";

interface BoardListProps {
  showArchived?: boolean;
}

const BoardList = memo(function BoardList({
  showArchived = false,
}: BoardListProps) {
  const {
    boards,
    loading,
    error,
    addBoard,
    updateBoard,
    deleteBoard,
    archiveBoard,
  } = useBoards();
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const filteredBoards = useMemo(() => {
    return boards.filter((board) =>
      showArchived ? board.is_archived : !board.is_archived
    );
  }, [boards, showArchived]);

  const handleCreate = useCallback(
    async (input: BoardInput) => {
      setActionLoading(true);
      try {
        await addBoard(input);
        setShowCreateModal(false);
      } catch (err) {
        console.error("Board oluşturma hatası:", err);
        alert(
          err instanceof Error ? err.message : "Board oluşturulamadı."
        );
      } finally {
        setActionLoading(false);
      }
    },
    [addBoard]
  );

  const handleEdit = useCallback((board: Board) => {
    setEditingBoard(board);
    setShowEditModal(true);
  }, []);

  const handleUpdate = useCallback(
    async (id: string, input: BoardInput) => {
      setActionLoading(true);
      try {
        await updateBoard(id, input);
        setShowEditModal(false);
        setEditingBoard(null);
      } catch (err) {
        console.error("Board güncelleme hatası:", err);
        alert(
          err instanceof Error ? err.message : "Board güncellenemedi."
        );
      } finally {
        setActionLoading(false);
      }
    },
    [updateBoard]
  );

  const handleDelete = useCallback(
    async (board: Board) => {
      setActionLoading(true);
      try {
        await deleteBoard(board.id);
      } catch (err) {
        console.error("Board silme hatası:", err);
        alert(err instanceof Error ? err.message : "Board silinemedi.");
      } finally {
        setActionLoading(false);
      }
    },
    [deleteBoard]
  );

  const handleArchive = useCallback(
    async (board: Board, archived: boolean) => {
      setActionLoading(true);
      try {
        await archiveBoard(board.id, archived);
      } catch (err) {
        console.error("Board arşivleme hatası:", err);
        alert(
          err instanceof Error ? err.message : "Board arşivlenemedi."
        );
      } finally {
        setActionLoading(false);
      }
    },
    [archiveBoard]
  );

  const handleCloseEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingBoard(null);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <p className="font-semibold">Hata:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      {!showArchived && (
        <div className="mb-6 flex items-center justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={actionLoading}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-60 disabled:hover:shadow-lg"
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Yeni Board Oluştur
          </button>
        </div>
      )}

      {filteredBoards.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
            <svg
              className="h-10 w-10 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {showArchived
              ? "Arşivlenmiş board bulunmuyor"
              : "Henüz board oluşturmadınız"}
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {showArchived
              ? "Arşivlenmiş board'larınız burada görünecek"
              : "İlk board'unuzu oluşturarak başlayın"}
          </p>
          {!showArchived && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              İlk Board'unu Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBoards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      <CreateBoardModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        loading={actionLoading}
      />

      <EditBoardModal
        open={showEditModal}
        onClose={handleCloseEdit}
        onSubmit={handleUpdate}
        board={editingBoard}
        loading={actionLoading}
      />
    </>
  );
});

export default BoardList;


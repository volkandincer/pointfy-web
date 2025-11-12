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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {showArchived ? "Arşivlenmiş Board'lar" : "Board'larım"}
        </h2>
        {!showArchived && (
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={actionLoading}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            + Yeni Board
          </button>
        )}
      </div>

      {filteredBoards.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">
            {showArchived
              ? "Arşivlenmiş board bulunmuyor."
              : "Henüz board oluşturmadınız."}
          </p>
          {!showArchived && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              İlk Board'unu Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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


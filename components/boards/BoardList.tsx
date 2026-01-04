"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import BoardCard from "./BoardCard";
import CreateBoardModal from "./CreateBoardModal";
import EditBoardModal from "./EditBoardModal";
import EmptyState from "@/components/jira/EmptyState";
import Button from "@/components/ui/Button";
import { useBoards } from "@/hooks/useBoards";
import { useToastContext } from "@/contexts/ToastContext";
import type { Board, BoardInput } from "@/interfaces/Board.interface";

interface BoardListProps {
  showArchived?: boolean;
}

const BoardList = memo(function BoardList({
  showArchived = false,
}: BoardListProps) {
  const router = useRouter();
  const {
    boards,
    loading,
    error,
    addBoard,
    updateBoard,
    deleteBoard,
    archiveBoard,
  } = useBoards();
  const { showToast } = useToastContext();
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
        const newBoard = await addBoard(input);
        setShowCreateModal(false);
        showToast("Board başarıyla oluşturuldu!", "success");
        // Yeni oluşturulan board'a yönlendir (new=true parametresi ile)
        router.push(`/app/boards/${newBoard.id}?new=true`);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Board oluşturulamadı.",
          "error"
        );
      } finally {
        setActionLoading(false);
      }
    },
    [addBoard, showToast, router]
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
        showToast("Board başarıyla güncellendi!", "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Board güncellenemedi.",
          "error"
        );
      } finally {
        setActionLoading(false);
      }
    },
    [updateBoard, showToast]
  );

  const handleDelete = useCallback(
    async (board: Board) => {
      setActionLoading(true);
      try {
        await deleteBoard(board.id);
        showToast("Board başarıyla silindi!", "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Board silinemedi.",
          "error"
        );
      } finally {
        setActionLoading(false);
      }
    },
    [deleteBoard, showToast]
  );

  const handleArchive = useCallback(
    async (board: Board, archived: boolean) => {
      setActionLoading(true);
      try {
        await archiveBoard(board.id, archived);
        showToast(
          archived
            ? "Board başarıyla arşivlendi!"
            : "Board arşivden çıkarıldı!",
          "success"
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Board arşivlenemedi.",
          "error"
        );
      } finally {
        setActionLoading(false);
      }
    },
    [archiveBoard, showToast]
  );

  const handleCloseEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingBoard(null);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-md border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border-2 border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <p className="font-semibold">Hata:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      {!showArchived && (
        <div className="mb-6 flex items-center justify-between border-b border-gray-300 pb-4 dark:border-gray-700">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {filteredBoards.length} Board
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            disabled={actionLoading}
            icon={Plus}
            className="!border-green-600 !bg-green-600 hover:!border-green-700 hover:!bg-green-700 dark:!border-green-500 dark:!bg-green-600 dark:hover:!bg-green-700"
          >
            Yeni Board
          </Button>
        </div>
      )}

      {filteredBoards.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={showArchived ? "Arşivlenmiş board bulunmuyor" : "Henüz board oluşturmadınız"}
          description={showArchived ? "Arşivlenmiş board'larınız burada görünecek" : "İlk board'unuzu oluşturarak başlayın"}
          actionLabel={!showArchived ? "İlk Board'unu Oluştur" : undefined}
          onAction={!showArchived ? () => setShowCreateModal(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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


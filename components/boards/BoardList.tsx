"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import BoardCard from "./BoardCard";
import CreateBoardModal from "./CreateBoardModal";
import EditBoardModal from "./EditBoardModal";
import EmptyState from "@/components/ui/EmptyState";
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse border-l-4 border-l-success border-t-2 border-r-2 border-b-2 border-border bg-card p-3 shadow-sm sm:p-4"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-red-600 dark:border-l-red-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md">
        {/* Glow Effect */}
        <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-red-500/10 to-red-500/5 blur-xl transition-all group-hover:scale-150" />
        
        {/* Content */}
        <div className="relative z-10">
          <p className="mb-1 font-semibold text-red-600 dark:text-red-400">Hata:</p>
          <p className="text-sm text-card-foreground">{error}</p>
        </div>
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
            className="group inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:border-primary hover:bg-primary/90 hover:shadow-md active:border-primary active:bg-primary/80 disabled:opacity-60 disabled:cursor-not-allowed sm:px-6 sm:py-3"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Yeni Board Oluştur
          </button>
        </div>
      )}

      {filteredBoards.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            showArchived
              ? "Arşivlenmiş board bulunmuyor"
              : "Henüz board oluşturmadınız"
          }
          description={
            showArchived
              ? "Arşivlenmiş board'larınız burada görünecek"
              : "İlk board'unuzu oluşturarak başlayın"
          }
          actionLabel={!showArchived ? "İlk Board'unu Oluştur" : undefined}
          onAction={!showArchived ? () => setShowCreateModal(true) : undefined}
        />
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

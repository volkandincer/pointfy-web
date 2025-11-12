"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PersonalTaskList from "@/components/tasks/PersonalTaskList";
import PersonalTaskModal from "@/components/tasks/PersonalTaskModal";
import NoteList from "@/components/notes/NoteList";
import NoteModal from "@/components/notes/NoteModal";
import EditBoardModal from "@/components/boards/EditBoardModal";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { Board, BoardInput } from "@/interfaces/Board.interface";
import type { PersonalTask, PersonalTaskInput } from "@/interfaces/PersonalTask.interface";
import type { Note, NoteInput } from "@/interfaces/Note.interface";
import { getSupabase } from "@/lib/supabase";
import { useBoards } from "@/hooks/useBoards";
import { useNotes } from "@/hooks/useNotes";
import { useToastContext } from "@/contexts/ToastContext";

export default function BoardDetailPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const boardId = String(params?.id);
  const { boards, updateBoard } = useBoards();
  const { notes, addNote, updateNote, removeNote } = useNotes();
  const { showToast } = useToastContext();

  const [board, setBoard] = useState<Board | null>(null);
  const [userKey, setUserKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Board'ı bul
  useEffect(() => {
    const foundBoard = boards.find((b) => b.id === boardId);
    if (foundBoard) {
      setBoard(foundBoard);
      setLoading(false);
    } else if (!boards.length) {
      // Boards henüz yüklenmediyse bekle
      setLoading(true);
    } else {
      // Board bulunamadı
      setLoading(false);
      router.replace("/app/boards");
    }
  }, [boards, boardId, router]);

  // User key'i al
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data.user) {
        setUserKey(data.user.id);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Board'a ait task'ları yükle
  useEffect(() => {
    if (!boardId || !userKey) return;

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const supabase = getSupabase();
      setTasksLoading(true);

      const { data: rows } = await supabase
        .from("user_personal_tasks")
        .select(
          "id, user_key, title, description, category, priority, created_at, board_id"
        )
        .eq("user_key", userKey)
        .eq("board_id", boardId)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (!mounted) return;
      setTasks(rows || []);
      setTasksLoading(false);

      // Realtime subscription
      const channel = supabase.channel("board-tasks-" + boardId);
      channel.on(
        // @ts-ignore
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_personal_tasks",
          filter: `board_id=eq.${boardId}`,
        },
        (payload: {
          eventType: string;
          new?: PersonalTask;
          old?: { id: string };
        }) => {
          if (!mounted) return;
          if (payload.eventType === "INSERT" && payload.new) {
            setTasks((prev) => [payload.new as PersonalTask, ...prev]);
          } else if (payload.eventType === "DELETE" && payload.old) {
            setTasks((prev) =>
              prev.filter((t) => t.id !== payload.old!.id)
            );
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === payload.new!.id ? (payload.new as PersonalTask) : t
              )
            );
          }
        }
      );
      channel.subscribe();
      unsubscribe = () => channel.unsubscribe();
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [boardId, userKey]);

  // Board'a ait notları filtrele
  const boardNotes = useMemo(() => {
    return notes.filter((note) => note.board_id === boardId);
  }, [notes, boardId]);

  const handleCreateTask = useCallback(
    async (input: PersonalTaskInput) => {
      if (!userKey || !boardId) return;
      setActionLoading(true);
      try {
        const supabase = getSupabase();
        const { data: newTask, error } = await supabase
          .from("user_personal_tasks")
          .insert({
            user_key: userKey,
            title: input.title,
            description: input.description ?? null,
            category: input.category ?? "general",
            priority: input.priority ?? 1,
            board_id: boardId,
          })
          .select()
          .single();
        if (error) throw error;

        // Realtime subscription çalışmıyorsa fallback olarak manuel ekle
        if (newTask) {
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === newTask.id);
            if (exists) return prev;
            return [newTask as PersonalTask, ...prev];
          });
        }

        setShowTaskModal(false);
        showToast("Task başarıyla eklendi!", "success");
      } catch (err) {
        console.error("Task oluşturma hatası:", err);
        showToast(
          err instanceof Error ? err.message : "Task oluşturulamadı.",
          "error"
        );
      } finally {
        setActionLoading(false);
      }
    },
    [userKey, boardId, showToast]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, input: PersonalTaskInput) => {
      setActionLoading(true);
      try {
        const supabase = getSupabase();
        const { data: updatedTask, error } = await supabase
          .from("user_personal_tasks")
          .update({
            title: input.title,
            description: input.description ?? null,
            category: input.category ?? "general",
            priority: input.priority ?? 1,
          })
          .eq("id", taskId)
          .select()
          .single();
        if (error) throw error;

        // Realtime subscription çalışmıyorsa fallback olarak manuel güncelle
        if (updatedTask) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === updatedTask.id ? (updatedTask as PersonalTask) : t
            )
          );
        }

        setShowTaskModal(false);
        setEditingTask(null);
        showToast("Task başarıyla güncellendi!", "success");
      } catch (err) {
        console.error("Task güncelleme hatası:", err);
        showToast(
          err instanceof Error ? err.message : "Task güncellenemedi.",
          "error"
        );
      } finally {
        setActionLoading(false);
      }
    },
    [showToast]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("user_personal_tasks")
          .delete()
          .eq("id", taskId);
        if (error) throw error;

        // Realtime subscription çalışmıyorsa fallback olarak manuel sil
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        showToast("Task başarıyla silindi!", "success");
      } catch (err) {
        console.error("Task silme hatası:", err);
        showToast(
          err instanceof Error ? err.message : "Task silinemedi.",
          "error"
        );
      }
    },
    [showToast]
  );

  const handleCreateNote = useCallback(
    async (input: NoteInput, noteId?: string) => {
      try {
        if (noteId) {
          await updateNote(noteId, input);
          showToast("Not başarıyla güncellendi!", "success");
        } else {
          // Yeni not oluştururken board_id ekle
          const supabase = getSupabase();
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) return;

          const { data: newNote, error } = await supabase
            .from("notes")
            .insert({
              user_key: userData.user.id,
              content: input.content,
              category: input.category,
              board_id: boardId,
            })
            .select()
            .single();
          if (error) {
            throw error;
          }

          // Notun board_id ile kaydedildiğini kontrol et
          if (newNote && newNote.board_id !== boardId) {
            console.warn("Not board_id ile kaydedilmedi, güncelleniyor...");
            const { error: updateError } = await supabase
              .from("notes")
              .update({ board_id: boardId })
              .eq("id", newNote.id);
            if (updateError) {
              console.error("Board_id güncelleme hatası:", updateError);
            }
          }

          // useNotes hook'u realtime ile güncelleyecek
          showToast("Not başarıyla eklendi!", "success");
        }
        setShowNoteModal(false);
        setEditingNote(null);
      } catch (err) {
        console.error("Not ekleme/güncelleme hatası:", err);
        showToast(
          err instanceof Error ? err.message : "Not kaydedilemedi.",
          "error"
        );
      }
    },
    [boardId, updateNote, showToast]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      try {
        await removeNote(noteId);
        showToast("Not başarıyla silindi!", "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Not silinemedi.",
          "error"
        );
      }
    },
    [removeNote, showToast]
  );

  const handleUpdateBoard = useCallback(
    async (id: string, input: BoardInput) => {
      setActionLoading(true);
      try {
        await updateBoard(id, input);
        setShowEditBoardModal(false);
        showToast("Board başarıyla güncellendi!", "success");
      } catch (err) {
        console.error("Board güncelleme hatası:", err);
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

  if (loading) {
    return (
      <RequireAuth>
        <>
          <Header navigationItems={navigationItems} />
          <main className="container mx-auto px-4 py-16">
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </main>
          <Footer navigationItems={navigationItems} />
        </>
      </RequireAuth>
    );
  }

  if (!board) {
    return (
      <RequireAuth>
        <>
          <Header navigationItems={navigationItems} />
          <main className="container mx-auto px-4 py-16">
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400">
                Board bulunamadı.
              </p>
            </div>
          </main>
          <Footer navigationItems={navigationItems} />
        </>
      </RequireAuth>
    );
  }

  const boardColor = board.color || "#3B82F6";
  const boardIcon = board.icon || "📋";

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-6xl">
            {/* Board Header */}
            <div
              className="group relative mb-8 overflow-hidden rounded-2xl border-2 border-white/20 p-8 text-white shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${boardColor} 0%, ${boardColor}dd 100%)`,
              }}
            >
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                />
              </div>

              <div className="relative z-10">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm">
                        {boardIcon}
                      </div>
                      <div>
                        <h1 className="mb-1 text-3xl font-bold tracking-tight">
                          {board.name}
                        </h1>
                        {board.description && (
                          <p className="text-white/90">{board.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditBoardModal(true)}
                    className="rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105"
                  >
                    <svg
                      className="mr-2 inline h-4 w-4"
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
                    Düzenle
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                    Task&apos;lar
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bu board&apos;a ait görevleriniz
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
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
                  Yeni Task
                </button>
              </div>
              {tasksLoading ? (
                <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
              ) : (
                <PersonalTaskList
                  tasks={tasks}
                  onDelete={handleDeleteTask}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setShowTaskModal(true);
                  }}
                />
              )}
            </div>

            {/* Notes Section */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                    Notlar
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bu board&apos;a ait notlarınız
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingNote(null);
                    setShowNoteModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-purple-800 hover:shadow-xl"
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
                  Yeni Not
                </button>
              </div>
              <NoteList
                notes={boardNotes}
                onDelete={handleDeleteNote}
                onEdit={(n) => {
                  setEditingNote(n);
                  setShowNoteModal(true);
                }}
              />
            </div>
            </div>
          </div>
        </main>

        {/* Modals */}
        <PersonalTaskModal
          open={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSubmit={async (input, taskId) => {
            if (taskId) {
              await handleUpdateTask(taskId, input);
            } else {
              await handleCreateTask(input);
            }
          }}
          initialTask={editingTask ?? undefined}
        />

        <NoteModal
          open={showNoteModal}
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(null);
          }}
          onSubmit={handleCreateNote}
          initialNote={editingNote ?? undefined}
        />

        <EditBoardModal
          open={showEditBoardModal}
          onClose={() => setShowEditBoardModal(false)}
          onSubmit={handleUpdateBoard}
          board={board}
          loading={actionLoading}
        />

        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}


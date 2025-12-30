"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Edit, Plus, ClipboardList, ListPlus, AlertCircle, CheckCircle2, Link2, Folder } from "lucide-react";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PersonalTaskList from "@/components/tasks/PersonalTaskList";
import PersonalTaskModal from "@/components/tasks/PersonalTaskModal";
import NoteList from "@/components/notes/NoteList";
import NoteModal from "@/components/notes/NoteModal";
import EditBoardModal from "@/components/boards/EditBoardModal";
import JiraTaskPromptModal from "@/components/boards/JiraTaskPromptModal";
import JiraTaskSelector from "@/components/jira/JiraTaskSelector";
import Modal from "@/components/ui/Modal";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { Board, BoardInput } from "@/interfaces/Board.interface";
import type { PersonalTask, PersonalTaskInput } from "@/interfaces/PersonalTask.interface";
import type { Note, NoteInput } from "@/interfaces/Note.interface";
import { getSupabase } from "@/lib/supabase";
import { useBoards } from "@/hooks/useBoards";
import { useNotes } from "@/hooks/useNotes";
import { useToastContext } from "@/contexts/ToastContext";
import { formatErrorMessage } from "@/lib/utils/errorHandler";

export default function BoardDetailPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const boardId = String(params?.id);
  const { boards, updateBoard } = useBoards();
  const { notes, updateNote, removeNote } = useNotes();
  const { showToast } = useToastContext();

  const [board, setBoard] = useState<Board | null>(null);
  const [userKey, setUserKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState<boolean>(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState<boolean>(false);
  const [availableTasks, setAvailableTasks] = useState<PersonalTask[]>([]);
  const [loadingAvailableTasks, setLoadingAvailableTasks] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<number | "jira" | string | null>(null);
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string | null>(null);
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [showJiraPrompt, setShowJiraPrompt] = useState<boolean>(false);
  const [showJiraTaskSelector, setShowJiraTaskSelector] = useState<boolean>(false);

  // Board'ı bul ve yeni oluşturulmuşsa Jira prompt'u göster
  useEffect(() => {
    const foundBoard = boards.find((b) => b.id === boardId);
    if (foundBoard) {
      setBoard(foundBoard);
      setLoading(false);
      
      // URL'den "new" parametresini kontrol et (board yeni oluşturulmuşsa)
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const isNewBoard = urlParams.get("new") === "true";
        
        // Jira bağlıysa ve yeni board ise prompt göster
        if (isNewBoard && jiraConnected && !showJiraPrompt && !showJiraTaskSelector) {
          // LocalStorage'da bu board için daha önce soruldu mu kontrol et
          const askedKey = `jira_prompt_asked_${boardId}`;
          const alreadyAsked = localStorage.getItem(askedKey);
          
          if (!alreadyAsked) {
            setShowJiraPrompt(true);
          }
        }
      }
    } else if (!boards.length) {
      // Boards henüz yüklenmediyse bekle
      setLoading(true);
    } else {
      // Board bulunamadı
      setLoading(false);
      router.replace("/app/boards");
    }
  }, [boards, boardId, router, jiraConnected, showJiraPrompt, showJiraTaskSelector]);

  // User key'i al ve Jira bağlantısını kontrol et
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data.user) {
        setUserKey(data.user.id);
        
        // Jira bağlantısını kontrol et
        const { data: userRow } = await supabase
          .from("users")
          .select("jira_access_token, jira_base_url")
          .eq("id", data.user.id)
          .maybeSingle();
        
        if (mounted && userRow) {
          const connected = !!userRow.jira_access_token;
          setJiraConnected(connected);
          if (connected && userRow.jira_base_url) {
            setJiraBaseUrl(userRow.jira_base_url);
          }
        }
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
          "id, user_key, title, description, category, priority, created_at, board_id, jira_issue_key, jira_issue_url"
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
        // @ts-expect-error - Supabase channel type inference issue
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

  // Task istatistikleri
  const taskStats = useMemo(() => {
    const totalTasks = tasks.length;
    const highPriority = tasks.filter((t) => t.priority === 3).length;
    const mediumPriority = tasks.filter((t) => t.priority === 2).length;
    const lowPriority = tasks.filter((t) => t.priority === 1).length;
    const jiraTasks = tasks.filter((t) => !!t.jira_issue_key && !!t.jira_issue_url).length;
    const generalCategory = tasks.filter((t) => t.category === "general").length;
    const workCategory = tasks.filter((t) => t.category === "work").length;
    const personalCategory = tasks.filter((t) => t.category === "personal").length;
    const meetingCategory = tasks.filter((t) => t.category === "meeting").length;
    const projectCategory = tasks.filter((t) => t.category === "project").length;
    return {
      totalTasks,
      highPriority,
      mediumPriority,
      lowPriority,
      jiraTasks,
      generalCategory,
      workCategory,
      personalCategory,
      meetingCategory,
      projectCategory,
    };
  }, [tasks]);

  // Filtrelenmiş tasklar
  const filteredTasks = useMemo(() => {
    if (filterType === null) return tasks;
    if (filterType === "jira") {
      return tasks.filter((t) => !!t.jira_issue_key && !!t.jira_issue_url);
    }
    if (typeof filterType === "string" && ["general", "work", "personal", "meeting", "project"].includes(filterType)) {
      return tasks.filter((t) => t.category === filterType);
    }
    return tasks.filter((t) => t.priority === filterType);
  }, [tasks, filterType]);

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
        // Task oluşturma hatası
        showToast(formatErrorMessage(err), "error");
      } finally {
        setActionLoading(false);
      }
    },
    [userKey, boardId, showToast]
  );

  // Mevcut task'ları yükle (board'a ait olmayanlar)
  const loadAvailableTasks = useCallback(async () => {
    if (!userKey) return;
    setLoadingAvailableTasks(true);
    try {
      const supabase = getSupabase();
      const { data: rows } = await supabase
        .from("user_personal_tasks")
        .select(
          "id, user_key, title, description, category, priority, created_at, board_id, jira_issue_key, jira_issue_url"
        )
        .eq("user_key", userKey)
        .or(`board_id.is.null,board_id.neq.${boardId}`)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      setAvailableTasks(rows || []);
    } catch {
      // Error loading available tasks
      setAvailableTasks([]);
    } finally {
      setLoadingAvailableTasks(false);
    }
  }, [userKey, boardId]);

  // Add task modal açıldığında task'ları yükle
  useEffect(() => {
    if (showAddTaskModal) {
      loadAvailableTasks();
    }
  }, [showAddTaskModal, loadAvailableTasks]);

  // Mevcut task'ı board'a ekle
  const handleAddExistingTask = useCallback(
    async (taskId: string) => {
      if (!boardId) return;
      setActionLoading(true);
      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("user_personal_tasks")
          .update({ board_id: boardId })
          .eq("id", taskId);
        if (error) throw error;

        // Realtime subscription çalışmıyorsa fallback olarak manuel ekle
        const addedTask = availableTasks.find((t) => t.id === taskId);
        if (addedTask) {
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === taskId);
            if (exists) return prev;
            return [{ ...addedTask, board_id: boardId }, ...prev];
          });
        }

        setShowAddTaskModal(false);
        showToast("Task board'a eklendi!", "success");
      } catch (err) {
        showToast(formatErrorMessage(err), "error");
      } finally {
        setActionLoading(false);
      }
    },
    [boardId, availableTasks, showToast]
  );

  // Jira task'ını board'a ekle
  const handleAddJiraTask = useCallback(
    async (jiraTask: { key: string; summary: string; description?: string; url: string }) => {
      console.log("handleAddJiraTask: Called with", { jiraTask, boardId, userKey });
      if (!boardId || !userKey) {
        console.error("handleAddJiraTask: Missing boardId or userKey");
        return;
      }
      if (!jiraTask || !jiraTask.key || !jiraTask.summary || !jiraTask.url) {
        showToast("Geçersiz task bilgisi", "error");
        return;
      }
      setActionLoading(true);
      try {
        const supabase = getSupabase();
        
        // Önce bu Jira task'ı zaten personal task olarak var mı kontrol et
        const { data: existingTask } = await supabase
          .from("user_personal_tasks")
          .select("id, board_id")
          .eq("user_key", userKey)
          .eq("jira_issue_key", jiraTask.key)
          .maybeSingle();

        if (existingTask) {
          // Zaten varsa, sadece board_id'yi güncelle
          if (existingTask.board_id !== boardId) {
            const { data: updatedTask, error: updateError } = await supabase
              .from("user_personal_tasks")
              .update({ board_id: boardId })
              .eq("id", existingTask.id)
              .select()
              .single();
            if (updateError) throw updateError;
            
            console.log("handleAddJiraTask: Existing task updated", updatedTask);
            
            // Güncellenmiş task'ı listeye ekle
            if (updatedTask) {
              setTasks((prev) => {
                const exists = prev.some((t) => t.id === updatedTask.id);
                if (exists) {
                  // Zaten varsa güncelle
                  return prev.map((t) =>
                    t.id === updatedTask.id ? (updatedTask as PersonalTask) : t
                  );
                }
                // Yoksa ekle
                return [updatedTask as PersonalTask, ...prev];
              });
            }
            
            showToast("Jira task board'a eklendi!", "success");
          } else {
            // Task zaten bu board'da, listeye ekle (eğer yoksa)
            const { data: currentTask } = await supabase
              .from("user_personal_tasks")
              .select("*")
              .eq("id", existingTask.id)
              .single();
            
            if (currentTask) {
              setTasks((prev) => {
                const exists = prev.some((t) => t.id === currentTask.id);
                if (!exists) {
                  return [currentTask as PersonalTask, ...prev];
                }
                return prev;
              });
            }
            
            showToast("Bu task zaten bu board'da!", "info");
          }
        } else {
          // Yeni personal task oluştur
          const { data: newTask, error } = await supabase
            .from("user_personal_tasks")
            .insert({
              user_key: userKey,
              title: jiraTask.summary,
              description: jiraTask.description || null,
              category: "work",
              priority: 2, // Default: Orta
              board_id: boardId,
              jira_issue_key: jiraTask.key,
              jira_issue_url: jiraTask.url,
            })
            .select()
            .single();
          
          if (error) throw error;
          
          // Realtime subscription çalışmıyorsa fallback olarak manuel ekle
          if (newTask) {
            console.log("handleAddJiraTask: New task created", newTask);
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === newTask.id);
              if (exists) {
                console.log("handleAddJiraTask: Task already exists in list, updating");
                return prev.map((t) =>
                  t.id === newTask.id ? (newTask as PersonalTask) : t
                );
              }
              console.log("handleAddJiraTask: Adding new task to list");
              return [newTask as PersonalTask, ...prev];
            });
          }
          
          showToast("Jira task board'a eklendi!", "success");
        }
      } catch (err) {
        showToast(formatErrorMessage(err), "error");
      } finally {
        setActionLoading(false);
      }
    },
    [boardId, userKey, showToast]
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
        // Task güncelleme hatası
        showToast(formatErrorMessage(err), "error");
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
        // Task silme hatası
        showToast(formatErrorMessage(err), "error");
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
            // Not board_id ile kaydedilmedi, güncelleniyor
            const { error: updateError } = await supabase
              .from("notes")
              .update({ board_id: boardId })
              .eq("id", newNote.id);
            if (updateError) {
              // Board_id güncelleme hatası
            }
          }

          // useNotes hook'u realtime ile güncelleyecek
          showToast("Not başarıyla eklendi!", "success");
        }
        setShowNoteModal(false);
        setEditingNote(null);
      } catch (err) {
        // Not ekleme/güncelleme hatası
        showToast(formatErrorMessage(err), "error");
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
        showToast(formatErrorMessage(err), "error");
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
        // Board güncelleme hatası
        showToast(formatErrorMessage(err), "error");
      } finally {
        setActionLoading(false);
      }
    },
    [updateBoard, showToast]
  );

  if (loading) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="h-40 animate-pulse border-l-4 border-l-green-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-green-500 dark:border-gray-700 dark:bg-gray-900" />
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  if (!board) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="rounded-md border-2 border-gray-200 bg-white p-6 text-center sm:p-8 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-600 dark:text-gray-400">
              Board bulunamadı.
            </p>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  const boardColor = board.color || "#3B82F6";

  return (
    <>
        <Header navigationItems={navigationItems} />
        <main className="min-h-screen bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-6xl">
            {/* Board Header - Sharp Design */}
            <div className="mb-6">
              <div
                className="rounded-md border-2 p-4 shadow-sm sm:p-6"
                style={{
                  borderColor: boardColor,
                  backgroundColor: boardColor,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-white/30 bg-white/20 sm:h-12 sm:w-12"
                        style={{
                          borderColor: "rgba(255, 255, 255, 0.3)",
                        }}
                      >
                        <ClipboardList className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                      </div>
                      <div>
                        <h1 className="mb-0.5 text-xl font-bold text-white sm:text-2xl">
                          {board.name}
                        </h1>
                        {board.description && (
                          <p className="text-xs text-white/90 sm:text-sm">
                            {board.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setShowEditBoardModal(true)}
                    icon={Edit}
                    className="!border-white/30 !bg-white/20 !text-white hover:!bg-white/30 dark:!border-white/30 dark:!bg-white/20 dark:!text-white dark:hover:!bg-white/30"
                  >
                    Düzenle
                  </Button>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="mb-0.5 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                    Task&apos;lar
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                    Bu board&apos;a ait görevleriniz
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setShowAddTaskModal(true);
                    }}
                    variant="secondary"
                    size="md"
                    icon={ListPlus}
                    className="!border-gray-300 !bg-white !text-gray-700 hover:!border-gray-400 hover:!bg-gray-50 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!border-gray-600 dark:hover:!bg-gray-700"
                  >
                    Task Ekle
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setEditingTask(null);
                      setShowTaskModal(true);
                    }}
                    icon={Plus}
                    className="!border-green-600 !bg-green-600 hover:!border-green-700 hover:!bg-green-700 dark:!border-green-500 dark:!bg-green-600 dark:hover:!border-green-400 dark:hover:!bg-green-500"
                  >
                    Yeni Task
                  </Button>
                </div>
              </div>
              {/* Stats Cards - Minimal & Clickable Filters */}
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 sm:gap-3">
                <button
                  onClick={() => setFilterType(null)}
                  className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                    filterType === null
                      ? "border-green-600 dark:border-green-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-green-600 bg-green-50 dark:bg-green-900/20 sm:h-10 sm:w-10">
                    <ClipboardList className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.totalTasks}</div>
                    <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Toplam</div>
                  </div>
                </button>

                {taskStats.highPriority > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === 3 ? null : 3)}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === 3
                        ? "border-red-600 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-red-600 bg-red-50 dark:bg-red-900/20 sm:h-10 sm:w-10">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.highPriority}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Yüksek</div>
                    </div>
                  </button>
                )}

                {taskStats.mediumPriority > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === 2 ? null : 2)}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === 2
                        ? "border-yellow-600 dark:border-yellow-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 sm:h-10 sm:w-10">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.mediumPriority}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Orta</div>
                    </div>
                  </button>
                )}

                {taskStats.lowPriority > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === 1 ? null : 1)}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === 1
                        ? "border-gray-600 dark:border-gray-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-gray-600 bg-gray-50 dark:bg-gray-800 sm:h-10 sm:w-10">
                      <CheckCircle2 className="h-4 w-4 text-gray-600 dark:text-gray-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.lowPriority}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Düşük</div>
                    </div>
                  </button>
                )}

                {taskStats.jiraTasks > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "jira" ? null : "jira")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "jira"
                        ? "border-purple-600 dark:border-purple-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20 sm:h-10 sm:w-10">
                      <Link2 className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.jiraTasks}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Jira&apos;da</div>
                    </div>
                  </button>
                )}

                {/* Category Filters */}
                {taskStats.generalCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "general" ? null : "general")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "general"
                        ? "border-blue-600 dark:border-blue-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.generalCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Genel</div>
                    </div>
                  </button>
                )}

                {taskStats.workCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "work" ? null : "work")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "work"
                        ? "border-green-600 dark:border-green-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-green-600 bg-green-50 dark:bg-green-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.workCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">İş</div>
                    </div>
                  </button>
                )}

                {taskStats.personalCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "personal" ? null : "personal")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "personal"
                        ? "border-pink-600 dark:border-pink-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-pink-600 bg-pink-50 dark:bg-pink-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-pink-600 dark:text-pink-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.personalCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Kişisel</div>
                    </div>
                  </button>
                )}

                {taskStats.meetingCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "meeting" ? null : "meeting")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "meeting"
                        ? "border-indigo-600 dark:border-indigo-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-indigo-600 dark:text-indigo-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.meetingCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Toplantı</div>
                    </div>
                  </button>
                )}

                {taskStats.projectCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "project" ? null : "project")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "project"
                        ? "border-cyan-600 dark:border-cyan-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-cyan-600 dark:text-cyan-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{taskStats.projectCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Proje</div>
                    </div>
                  </button>
                )}
              </div>

              {tasksLoading ? (
                <div className="h-40 animate-pulse border-l-4 border-l-green-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-green-500 dark:border-gray-700 dark:bg-gray-900" />
              ) : (
                <PersonalTaskList
                  tasks={filteredTasks}
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
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="mb-0.5 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                    Notlar
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                    Bu board&apos;a ait notlarınız
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setEditingNote(null);
                    setShowNoteModal(true);
                  }}
                  icon={Plus}
                  className="!border-green-600 !bg-green-600 hover:!border-green-700 hover:!bg-green-700 dark:!border-green-500 dark:!bg-green-600 dark:hover:!border-green-400 dark:hover:!bg-green-500"
                >
                  Yeni Not
                </Button>
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

        {/* Add Existing Task Modal */}
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-md border-2 border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b-2 border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Mevcut Task&apos;lardan Seç
                  </h3>
                  <button
                    onClick={() => setShowAddTaskModal(false)}
                    className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {loadingAvailableTasks ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-600"></div>
                  </div>
                ) : availableTasks.length === 0 ? (
                  <div className="py-12 text-center">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                      Eklenebilecek task bulunamadı
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Tüm task&apos;larınız zaten bu board&apos;a ekli
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleAddExistingTask(task.id)}
                        disabled={actionLoading}
                        className="group w-full rounded-md border-2 border-gray-300 bg-white p-3 text-left transition-all hover:border-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-500 dark:hover:bg-green-900/20"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {task.jira_issue_key && (
                                <span className="rounded-md border-2 border-purple-600 bg-purple-600 px-2 py-0.5 font-mono text-xs font-bold text-white">
                                  {task.jira_issue_key}
                                </span>
                              )}
                              <span className="rounded-md border-2 border-gray-300 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {task.category === "general" ? "Genel" : task.category === "work" ? "İş" : task.category === "personal" ? "Kişisel" : task.category === "meeting" ? "Toplantı" : task.category === "project" ? "Proje" : task.category}
                              </span>
                            </div>
                          </div>
                          <Plus className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-green-600 dark:text-gray-500 dark:group-hover:text-green-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jira Task Prompt Modal */}
        <JiraTaskPromptModal
          open={showJiraPrompt}
          onClose={() => {
            setShowJiraPrompt(false);
            // LocalStorage'a kaydet ki bir daha sormasın
            const askedKey = `jira_prompt_asked_${boardId}`;
            localStorage.setItem(askedKey, "true");
          }}
          onConfirm={() => {
            setShowJiraPrompt(false);
            setShowJiraTaskSelector(true);
            // LocalStorage'a kaydet ki bir daha sormasın
            const askedKey = `jira_prompt_asked_${boardId}`;
            localStorage.setItem(askedKey, "true");
          }}
        />

        {/* Jira Task Selector Modal */}
        {jiraBaseUrl && (
          <Modal
            open={showJiraTaskSelector}
            onClose={() => setShowJiraTaskSelector(false)}
            title={
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                  <Link2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-bold">Jira Task&apos;larından Seç</span>
              </div>
            }
            className="sm:border-purple-600/30 dark:sm:border-purple-500/30"
          >
              <JiraTaskSelector
                jiraBaseUrl={jiraBaseUrl}
                onTaskSelect={async (task) => {
                  if (!task || !task.key || !task.summary || !task.url) {
                    showToast("Geçersiz task seçildi", "error");
                    return;
                  }
                  console.log("JiraTaskSelector: Task selected", task);
                  try {
                    await handleAddJiraTask({
                      key: task.key,
                      summary: task.summary,
                      description: task.description,
                      url: task.url,
                    });
                    setShowJiraTaskSelector(false);
                  } catch (error) {
                    console.error("JiraTaskSelector: Error adding task", error);
                  }
                }}
                onCancel={() => setShowJiraTaskSelector(false)}
              />
          </Modal>
        )}

        <Footer navigationItems={navigationItems} />
    </>
  );
}


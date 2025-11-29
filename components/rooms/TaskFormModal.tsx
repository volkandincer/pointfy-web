"use client";

import { memo, useState, useCallback, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { getSupabase } from "@/lib/supabase";
import JiraTaskSelector from "@/components/jira/JiraTaskSelector";
import type { PersonalTask } from "@/interfaces/PersonalTask.interface";
import type { JiraTask } from "@/interfaces/Jira.interface";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    description?: string,
    jiraKey?: string,
    jiraUrl?: string,
    jiraId?: string
  ) => Promise<void>;
  loading?: boolean;
}

const TaskFormModal = memo(function TaskFormModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: TaskFormModalProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [mode, setMode] = useState<"create" | "select" | "jira">("create");
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string | null>(null);
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [jiraKey, setJiraKey] = useState<string | undefined>(undefined);
  const [jiraUrl, setJiraUrl] = useState<string | undefined>(undefined);
  const [jiraId, setJiraId] = useState<string | undefined>(undefined);

  // Jira bağlantı durumunu kontrol et
  useEffect(() => {
    if (!open) return;

    let mounted = true;
    async function checkJiraConnection() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) return;

        const { data: userRow } = await supabase
          .from("users")
          .select("jira_access_token, jira_base_url")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (mounted) {
          setJiraConnected(!!userRow?.jira_access_token);
          if (userRow?.jira_base_url) {
            setJiraBaseUrl(userRow.jira_base_url);
          }
        }
      } catch (err) {
        console.error("Jira connection check error:", err);
      }
    }

    checkJiraConnection();

    return () => {
      mounted = false;
    };
  }, [open]);

  // Personal tasks'ları getir
  useEffect(() => {
    if (!open || mode !== "select") {
      setPersonalTasks([]);
      return;
    }

    let mounted = true;
    async function fetchPersonalTasks() {
      setLoadingTasks(true);
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) {
          if (mounted) setLoadingTasks(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_personal_tasks")
          .select("id, user_key, title, description, category, priority, created_at")
          .eq("user_key", userData.user.id)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false });

        if (!mounted) return;

        if (error) {
          console.error("Personal tasks fetch error:", error);
          if (mounted) setPersonalTasks([]);
        } else {
          if (mounted) setPersonalTasks((data || []) as PersonalTask[]);
        }
      } catch (err) {
        console.error("Personal tasks fetch exception:", err);
        if (mounted) setPersonalTasks([]);
      } finally {
        if (mounted) setLoadingTasks(false);
      }
    }

    fetchPersonalTasks();
    return () => {
      mounted = false;
    };
  }, [open, mode]);

  // Modal kapandığında state'i temizle
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setMode("create");
      setSelectedTaskId(null);
      setJiraKey(undefined);
      setJiraUrl(undefined);
      setJiraId(undefined);
    }
  }, [open]);

  // Task seçildiğinde formu doldur
  const handleTaskSelect = useCallback((task: PersonalTask) => {
    setSelectedTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setMode("create"); // Seçim yapıldıktan sonra create moduna geç
  }, []);

  // Jira task seçildiğinde formu doldur
  const handleJiraTaskSelect = useCallback((task: JiraTask) => {
    setTitle(task.summary);
    setDescription(task.description || "");
    setJiraKey(task.key);
    setJiraUrl(task.url);
    setJiraId(task.id);
    setMode("create"); // Seçim yapıldıktan sonra create moduna geç
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!title.trim()) return;
      await onSubmit(
        title.trim(),
        description.trim() || undefined,
        jiraKey,
        jiraUrl,
        jiraId
      );
      setTitle("");
      setDescription("");
      setSelectedTaskId(null);
      setJiraKey(undefined);
      setJiraUrl(undefined);
      setJiraId(undefined);
      onClose();
    },
    [description, jiraId, jiraKey, jiraUrl, onClose, onSubmit, title]
  );

  const isCreateMode = mode === "create";
  const isSelectMode = mode === "select";
  const isJiraMode = mode === "jira";

  return (
    <Modal open={open} onClose={onClose} title="Yeni Task Ekle">
      {isCreateMode ? (
        <>
          {/* Mode Seçimi */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isCreateMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              ✏️ Yeni Task Oluştur
            </button>
            <button
              type="button"
              onClick={() => setMode("select")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isSelectMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              📋 Task&apos;larımdan Seç
            </button>
            {jiraConnected && (
              <button
                type="button"
                onClick={() => setMode("jira")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isJiraMode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                🔗 Jira&apos;dan Seç
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="task-title"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Başlık
                {jiraKey && (
                  <span className="ml-2 font-mono text-xs text-blue-600 dark:text-blue-400">
                    ({jiraKey})
                  </span>
                )}
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task başlığı"
                maxLength={200}
                required
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="task-desc"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Açıklama (opsiyonel)
              </label>
              <textarea
                id="task-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task açıklaması"
                maxLength={500}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Ekleniyor..." : "Ekle"}
              </button>
            </div>
          </form>
        </>
      ) : isSelectMode ? (
        <>
          {/* Mode Seçimi */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isCreateMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              ✏️ Yeni Task Oluştur
            </button>
            <button
              type="button"
              onClick={() => setMode("select")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isSelectMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              📋 Task&apos;larımdan Seç
            </button>
            {jiraConnected && (
              <button
                type="button"
                onClick={() => setMode("jira")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isJiraMode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                🔗 Jira&apos;dan Seç
              </button>
            )}
          </div>

          {/* Personal Tasks Listesi */}
          <div className="max-h-[400px] overflow-y-auto">
            {loadingTasks ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Task&apos;lar yükleniyor...
                </p>
              </div>
            ) : personalTasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-2 text-4xl">📋</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Henüz task yok
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Önce kişisel task&apos;larınızı oluşturun
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {personalTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleTaskSelect(task)}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      selectedTaskId === task.id
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                        : "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
                    }`}
                  >
                    <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {task.category}
                      </span>
                      {task.priority > 1 && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          ⭐ {task.priority}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              İptal
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Mode Seçimi */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isCreateMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              ✏️ Yeni Task Oluştur
            </button>
            <button
              type="button"
              onClick={() => setMode("select")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                isSelectMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              📋 Task&apos;larımdan Seç
            </button>
            {jiraConnected && (
              <button
                type="button"
                onClick={() => setMode("jira")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isJiraMode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                🔗 Jira&apos;dan Seç
              </button>
            )}
          </div>

          {/* Jira Task Selector */}
          {jiraBaseUrl ? (
            <JiraTaskSelector
              onTaskSelect={handleJiraTaskSelect}
              onCancel={onClose}
              jiraBaseUrl={jiraBaseUrl}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-2 text-4xl">⚠️</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Jira URL&apos;i bulunamadı
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Lütfen hesap ayarlarından Jira URL&apos;inizi girin
              </p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
});

export default TaskFormModal;

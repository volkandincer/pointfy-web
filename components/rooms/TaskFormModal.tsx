"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Link2, Star, Edit, ClipboardList } from "lucide-react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";
import Input, { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
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
  const [mode, setMode] = useState<"create" | "select" | "jira">("create");
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string | null>(null);
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [jiraKey, setJiraKey] = useState<string | undefined>(undefined);
  const [jiraUrl, setJiraUrl] = useState<string | undefined>(undefined);
  const [jiraId, setJiraId] = useState<string | undefined>(undefined);

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .trim()
      .min(1, "Başlık gereklidir")
      .max(200, "Başlık en fazla 200 karakter olabilir")
      .required("Başlık gereklidir"),
    description: Yup.string()
      .trim()
      .max(500, "Açıklama en fazla 500 karakter olabilir"),
  });

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
        // Jira connection check error
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
          // Personal tasks fetch error
          if (mounted) setPersonalTasks([]);
        } else {
          if (mounted) setPersonalTasks((data || []) as PersonalTask[]);
        }
      } catch (err) {
        // Personal tasks fetch exception
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
    setMode("create"); // Seçim yapıldıktan sonra create moduna geç
  }, []);

  // Jira task seçildiğinde formu doldur
  const handleJiraTaskSelect = useCallback((task: JiraTask) => {
    setJiraKey(task.key);
    setJiraUrl(task.url);
    setJiraId(task.id);
    setMode("create"); // Seçim yapıldıktan sonra create moduna geç
  }, []);

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
              <Edit className="mr-1.5 inline h-4 w-4" />
              Yeni Task Oluştur
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
              <ClipboardList className="mr-1.5 inline h-4 w-4" />
              Task&apos;larımdan Seç
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
                <Link2 className="mr-1.5 inline h-4 w-4" />
                Jira&apos;dan Seç
              </button>
            )}
          </div>

          <Formik
            initialValues={{
              title: selectedTaskId
                ? personalTasks.find((t) => t.id === selectedTaskId)?.title || ""
                : "",
              description: selectedTaskId
                ? personalTasks.find((t) => t.id === selectedTaskId)?.description || ""
                : "",
            }}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={async (values, { resetForm }) => {
              await onSubmit(
                values.title.trim(),
                values.description.trim() || undefined,
                jiraKey,
                jiraUrl,
                jiraId
              );
              resetForm();
              setSelectedTaskId(null);
              setJiraKey(undefined);
              setJiraUrl(undefined);
              setJiraId(undefined);
              onClose();
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <Field name="title">
                  {({ field, meta }: FieldProps) => (
                    <Input
                      {...field}
                      id="task-title"
                      type="text"
                      label={
                        <>
                          Başlık
                          {jiraKey && (
                            <span className="ml-2 font-mono text-xs text-blue-600 dark:text-blue-400">
                              ({jiraKey})
                            </span>
                          )}
                        </>
                      }
                      placeholder="Task başlığı"
                      maxLength={200}
                      required
                      disabled={loading || isSubmitting}
                      error={meta.touched && meta.error ? meta.error : undefined}
                    />
                  )}
                </Field>
                <Field name="description">
                  {({ field, meta }: FieldProps) => (
                    <Textarea
                      {...field}
                      id="task-desc"
                      label="Açıklama (opsiyonel)"
                      rows={3}
                      placeholder="Task açıklaması"
                      maxLength={500}
                      disabled={loading || isSubmitting}
                      error={meta.touched && meta.error ? meta.error : undefined}
                    />
                  )}
                </Field>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onClose}
                    disabled={loading || isSubmitting}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={loading || isSubmitting}
                    loading={loading || isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {loading || isSubmitting ? "Ekleniyor..." : "Ekle"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
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
              <Edit className="mr-1.5 inline h-4 w-4" />
              Yeni Task Oluştur
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
              <ClipboardList className="mr-1.5 inline h-4 w-4" />
              Task&apos;larımdan Seç
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
                <Link2 className="mr-1.5 inline h-4 w-4" />
                Jira&apos;dan Seç
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
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center border-2 border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <ClipboardList className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
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
                    className={`w-full rounded-md border-2 p-3 text-left transition-all hover:shadow-md ${
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
                      <span className="rounded-md border-2 border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {task.category}
                      </span>
                      {task.priority > 1 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-md border-2 border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
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
              <Edit className="mr-1.5 inline h-4 w-4" />
              Yeni Task Oluştur
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
              <ClipboardList className="mr-1.5 inline h-4 w-4" />
              Task&apos;larımdan Seç
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
                <Link2 className="mr-1.5 inline h-4 w-4" />
                Jira&apos;dan Seç
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
            <div className="rounded-md border-2 border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
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

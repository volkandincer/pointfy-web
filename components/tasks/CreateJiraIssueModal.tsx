"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link2, Loader2, AlertCircle } from "lucide-react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";
import Input, { Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { getSupabase } from "@/lib/supabase";
import { authFetch } from "@/lib/authFetch";
import type { PersonalTask } from "@/interfaces/PersonalTask.interface";
import type { JiraBoard } from "@/interfaces/Jira.interface";

interface CreateJiraIssueModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (issueKey: string, issueUrl: string) => void;
  personalTask?: PersonalTask;
}

interface IssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

const CreateJiraIssueModal = memo(function CreateJiraIssueModal({
  open,
  onClose,
  onSuccess,
  personalTask,
}: CreateJiraIssueModalProps) {
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const [projects, setProjects] = useState<JiraBoard[]>([]);
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>("");
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const validationSchema = Yup.object().shape({
    summary: Yup.string()
      .trim()
      .min(1, "Başlık gereklidir")
      .max(255, "Başlık en fazla 255 karakter olabilir")
      .required("Başlık gereklidir"),
    description: Yup.string()
      .trim()
      .max(5000, "Açıklama en fazla 5000 karakter olabilir"),
  });

  // Jira base URL'i al
  useEffect(() => {
    let mounted = true;
    async function getJiraBaseUrl() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) return;

        const { data: userRow } = await supabase
          .from("users")
          .select("jira_base_url")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (mounted && userRow?.jira_base_url) {
          setJiraBaseUrl(userRow.jira_base_url);
        }
      } catch (err) {
        // Jira base URL fetch error
      }
    }

    getJiraBaseUrl();

    return () => {
      mounted = false;
    };
  }, []);

  // Projeleri yükle
  useEffect(() => {
    if (!open || !jiraBaseUrl) return;

    let mounted = true;
    async function fetchProjects() {
      setLoadingProjects(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();

        if (!mounted || !userData.user) {
          if (mounted) setLoadingProjects(false);
          return;
        }

        const urlParams = new URLSearchParams();
        urlParams.set("jiraBaseUrl", jiraBaseUrl);

        const response = await authFetch(`/api/jira/boards?${urlParams.toString()}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          throw new Error(data.error || "Projeler yüklenemedi");
        }

        const boards = data.boards || [];
        setProjects(boards);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Projeler yüklenirken hata oluştu");
      } finally {
        if (mounted) setLoadingProjects(false);
      }
    }

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, [open, jiraBaseUrl]);

  // Issue type'ları yükle (proje seçildiğinde)
  useEffect(() => {
    if (!open || !selectedProjectKey || !jiraBaseUrl) {
      setIssueTypes([]);
      setSelectedIssueTypeId("");
      return;
    }

    let mounted = true;
    async function fetchIssueTypes() {
      setLoadingIssueTypes(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();

        if (!mounted || !userData.user) {
          if (mounted) setLoadingIssueTypes(false);
          return;
        }

        const urlParams = new URLSearchParams();
        urlParams.set("jiraBaseUrl", jiraBaseUrl);

        const response = await authFetch(
          `/api/jira/projects/${selectedProjectKey}/issue-types?${urlParams.toString()}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          throw new Error(data.error || "Issue type'ları yüklenemedi");
        }

        const types = data.issueTypes || [];
        setIssueTypes(types);
        // İlk issue type'ı otomatik seç
        if (types.length > 0) {
          setSelectedIssueTypeId(types[0].id);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Issue type'ları yüklenirken hata oluştu");
      } finally {
        if (mounted) setLoadingIssueTypes(false);
      }
    }

    fetchIssueTypes();

    return () => {
      mounted = false;
    };
  }, [open, selectedProjectKey, jiraBaseUrl]);

  // Modal kapandığında state'i temizle
  useEffect(() => {
    if (!open) {
      setSelectedProjectKey("");
      setSelectedIssueTypeId("");
      setError(null);
    }
  }, [open]);

  const handleCreate = useCallback(async (values: { summary: string; description: string }) => {
    if (!selectedProjectKey || !selectedIssueTypeId) {
      setError("Lütfen proje ve issue tipi seçin");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Lütfen giriş yapın");
      }

      const urlParams = new URLSearchParams();

      const response = await authFetch(`/api/jira/issues/create?${urlParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          projectKey: selectedProjectKey,
          issueTypeId: selectedIssueTypeId,
          summary: values.summary.trim(),
          description: values.description.trim() || undefined,
          jiraBaseUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Issue oluşturulamadı");
      }

      onSuccess(data.issue.key, data.issue.url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Issue oluşturulurken hata oluştu");
    } finally {
      setCreating(false);
    }
  }, [selectedProjectKey, selectedIssueTypeId, jiraBaseUrl, onSuccess, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
            <Link2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="font-bold">Jira&apos;da Task Aç</span>
        </div>
      }
      className="sm:border-purple-600/30 dark:sm:border-purple-500/30"
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-md border-2 border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Project Selection */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
            Proje <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          {loadingProjects ? (
            <div className="flex items-center gap-2 rounded-md border-2 border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Projeler yükleniyor...</span>
            </div>
          ) : (
            <select
              value={selectedProjectKey}
              onChange={(e) => setSelectedProjectKey(e.target.value)}
              className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
            >
              <option value="">Proje seçin...</option>
              {projects.map((project) => (
                <option key={project.location?.projectKey || project.id} value={project.location?.projectKey}>
                  {project.name} ({project.location?.projectKey})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Issue Type Selection */}
        {selectedProjectKey && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
              Issue Tipi <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            {loadingIssueTypes ? (
              <div className="flex items-center gap-2 rounded-md border-2 border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Issue type&apos;ları yükleniyor...</span>
              </div>
            ) : issueTypes.length > 0 ? (
              <select
                value={selectedIssueTypeId}
                onChange={(e) => setSelectedIssueTypeId(e.target.value)}
                className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
              >
                {issueTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Issue type bulunamadı</p>
            )}
          </div>
        )}

        <Formik
          initialValues={{
            summary: personalTask?.title || "",
            description: personalTask?.description || "",
          }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleCreate}
        >
          {({ isSubmitting, values }) => (
            <Form className="space-y-3 sm:space-y-4">
              {/* Summary */}
              <Field name="summary">
                {({ field, meta }: FieldProps) => (
                  <div>
                    <Input
                      {...field}
                      id="jira-summary"
                      type="text"
                      label="Başlık"
                      placeholder="Issue başlığı..."
                      maxLength={255}
                      required
                      disabled={creating || isSubmitting}
                      error={meta.touched && meta.error ? meta.error : undefined}
                      showCharCount
                    />
                  </div>
                )}
              </Field>

              {/* Description */}
              <Field name="description">
                {({ field, meta }: FieldProps) => (
                  <div>
                    <Textarea
                      {...field}
                      id="jira-description"
                      label="Açıklama (İsteğe Bağlı)"
                      placeholder="Issue açıklaması..."
                      rows={4}
                      maxLength={5000}
                      disabled={creating || isSubmitting}
                      error={meta.touched && meta.error ? meta.error : undefined}
                      showCharCount
                    />
                  </div>
                )}
              </Field>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t-2 border-gray-200 pt-3 dark:border-gray-800 sm:gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  disabled={creating || isSubmitting}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!selectedProjectKey || !selectedIssueTypeId || creating || isSubmitting}
                  loading={creating || isSubmitting}
                  className="!border-purple-600 !bg-purple-600 hover:!border-purple-700 hover:!bg-purple-700 dark:!border-purple-500 dark:!bg-purple-600 dark:hover:!border-purple-400 dark:hover:!bg-purple-500"
                >
                  {creating || isSubmitting ? "Oluşturuluyor..." : "Jira&apos;da Aç"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
});

export default CreateJiraIssueModal;


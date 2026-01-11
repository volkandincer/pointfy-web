"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  User,
  Tag,
  Flag,
  Folder,
  Clock,
  CheckCircle,
  Edit,
  X,
  Save,
  Loader2,
  Search,
  FileText,
  MessageSquare,
  Send,
} from "lucide-react";
import { getStatusColorClasses, getPriorityColorClasses } from "@/lib/jira/colors";
import type { JiraTask, JiraComment } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import { useToastContext } from "@/contexts/ToastContext";
import Modal from "@/components/ui/Modal";
import { formatErrorMessage } from "@/lib/utils/errorHandler";

interface AssignableUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatar?: string;
}

export default function JiraIssueDetailPage() {
  const params = useParams<{ issueKey: string }>();
  const router = useRouter();
  const { showToast } = useToastContext();
  const issueKey = params?.issueKey ? String(params.issueKey) : "";

  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const [issue, setIssue] = useState<JiraTask | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Story points
  const [storyPoints, setStoryPoints] = useState<number | null>(null);
  const [storyPointsLoading, setStoryPointsLoading] = useState<boolean>(false);
  const [storyPointsEditing, setStoryPointsEditing] = useState<boolean>(false);
  const [storyPointsInput, setStoryPointsInput] = useState<string>("");
  
  // Assignee
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [assigneeModalOpen, setAssigneeModalOpen] = useState<boolean>(false);
  const [assigneeLoading, setAssigneeLoading] = useState<boolean>(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState<string>("");

  // Comments
  const [comments, setComments] = useState<JiraComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>("");
  const [addingComment, setAddingComment] = useState<boolean>(false);

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
      } catch {
        // Jira base URL fetch error
      }
    }

    getJiraBaseUrl();

    return () => {
      mounted = false;
    };
  }, []);

  // Issue fetch
  const fetchIssue = useCallback(async () => {
    if (!jiraBaseUrl || !issueKey || issueKey === "undefined" || issueKey === "null") return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(
        `/api/jira/issues/${issueKey}?${urlParams.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch issue";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON parse failed, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setIssue(data.issue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load issue";
      setError(formatErrorMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [jiraBaseUrl, issueKey]);

  useEffect(() => {
    if (jiraBaseUrl && issueKey) {
      fetchIssue();
    }
  }, [jiraBaseUrl, issueKey, fetchIssue]);

  // Story points fetch
  const fetchStoryPoints = useCallback(async () => {
    if (!jiraBaseUrl || !issueKey || !issue?.id) return;

    setStoryPointsLoading(true);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);
      urlParams.set("issueId", issue.id);

      const response = await fetch(
        `/api/jira/get-story-points?${urlParams.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.storyPoints !== null && data.storyPoints !== undefined) {
        setStoryPoints(data.storyPoints);
        setStoryPointsInput(String(data.storyPoints));
      }
    } catch {
      // Story points fetch error
    } finally {
      setStoryPointsLoading(false);
    }
  }, [jiraBaseUrl, issueKey, issue?.id]);

  useEffect(() => {
    if (issue?.id) {
      fetchStoryPoints();
    }
  }, [issue?.id, fetchStoryPoints]);

  // Assignable users fetch
  const fetchAssignableUsers = useCallback(async () => {
    if (!jiraBaseUrl || !issueKey) return;

    setAssigneeLoading(true);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setAssigneeLoading(false);
        return;
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);
      if (assigneeSearchQuery.trim()) {
        urlParams.set("query", assigneeSearchQuery.trim());
      }

      const response = await fetch(
        `/api/jira/issues/${issueKey}/assignable-users?${urlParams.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAssignableUsers(data.users || []);
      } else {
        showToast(
          data.error || "Kullanıcılar yüklenemedi",
          "error"
        );
        setAssignableUsers([]);
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Kullanıcılar yüklenirken hata oluştu",
        "error"
      );
      setAssignableUsers([]);
    } finally {
      setAssigneeLoading(false);
    }
  }, [jiraBaseUrl, issueKey, assigneeSearchQuery, showToast]);

  useEffect(() => {
    if (assigneeModalOpen && jiraBaseUrl && issueKey) {
      fetchAssignableUsers();
    } else if (!assigneeModalOpen) {
      // Modal kapandığında search query'yi temizle
      setAssigneeSearchQuery("");
    }
  }, [assigneeModalOpen, jiraBaseUrl, issueKey, fetchAssignableUsers]);

  // Search query değiştiğinde kullanıcıları yeniden çek
  useEffect(() => {
    if (assigneeModalOpen && jiraBaseUrl && issueKey && assigneeSearchQuery.trim()) {
      // Debounce için kısa bir gecikme
      const timeoutId = setTimeout(() => {
        fetchAssignableUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (assigneeModalOpen && jiraBaseUrl && issueKey && !assigneeSearchQuery.trim()) {
      // Query boşsa tüm kullanıcıları çek
      fetchAssignableUsers();
    }
  }, [assigneeSearchQuery, assigneeModalOpen, jiraBaseUrl, issueKey, fetchAssignableUsers]);

  // Story points update
  const updateStoryPoints = useCallback(async () => {
    if (!jiraBaseUrl || !issueKey || !issue?.id) return;

    const points = storyPointsInput.trim() === "" ? null : parseFloat(storyPointsInput);
    if (points !== null && (isNaN(points) || points < 0)) {
      showToast("Geçerli bir sayı girin", "error");
      return;
    }

    setStoryPointsLoading(true);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("userId", userData.user.id);

      const response = await fetch(`/api/jira/set-story-points?${urlParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          issueId: issue.id,
          storyPoints: points,
          jiraBaseUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update story points");
      }

      setStoryPoints(points);
      setStoryPointsEditing(false);
      showToast("Story points başarıyla güncellendi", "success");
      fetchIssue(); // Issue'u yeniden yükle
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Story points güncellenemedi",
        "error"
      );
    } finally {
      setStoryPointsLoading(false);
    }
  }, [jiraBaseUrl, issueKey, issue?.id, storyPointsInput, showToast, fetchIssue]);

  // Assignee update
  const updateAssignee = useCallback(async (accountId: string | null) => {
    if (!jiraBaseUrl || !issueKey) return;

    setAssigneeLoading(true);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(
        `/api/jira/issues/${issueKey}/assign?${urlParams.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            accountId: accountId,
            jiraBaseUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign issue");
      }

      setAssigneeModalOpen(false);
      showToast(
        accountId ? "Issue başarıyla atandı" : "Issue ataması kaldırıldı",
        "success"
      );
      fetchIssue(); // Issue'u yeniden yükle
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Issue atanamadı",
        "error"
      );
    } finally {
      setAssigneeLoading(false);
    }
  }, [jiraBaseUrl, issueKey, showToast, fetchIssue]);

  // Filtered assignable users
  const filteredAssignableUsers = useMemo(() => {
    if (!assigneeSearchQuery.trim()) return assignableUsers;
    const query = assigneeSearchQuery.toLowerCase();
    return assignableUsers.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.emailAddress?.toLowerCase().includes(query)
    );
  }, [assignableUsers, assigneeSearchQuery]);

  // Date format helper
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCommentDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Comments fetch
  const fetchComments = useCallback(async () => {
    if (!jiraBaseUrl || !issueKey) return;

    setCommentsLoading(true);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(
        `/api/jira/issues/${issueKey}/comments?${urlParams.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch {
      // Comments fetch error
    } finally {
      setCommentsLoading(false);
    }
  }, [jiraBaseUrl, issueKey]);

  useEffect(() => {
    if (jiraBaseUrl && issueKey && issue) {
      fetchComments();
    }
  }, [jiraBaseUrl, issueKey, issue, fetchComments]);

  // Add comment
  const handleAddComment = useCallback(async () => {
    if (!jiraBaseUrl || !issueKey || !newComment.trim()) return;

    setAddingComment(true);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(
        `/api/jira/issues/${issueKey}/comments?${urlParams.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            body: newComment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setNewComment("");
        showToast("Yorum başarıyla eklendi", "success");
        fetchComments(); // Refresh comments
      } else {
        showToast(data.error || "Yorum eklenemedi", "error");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Yorum eklenirken hata oluştu",
        "error"
      );
    } finally {
      setAddingComment(false);
    }
  }, [jiraBaseUrl, issueKey, newComment, showToast, fetchComments]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="h-96 animate-pulse rounded-md border-2 border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.back()}
          icon={ArrowLeft}
        >
          Geri
        </Button>
        <div className="rounded-md border-2 border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error || "Issue bulunamadı"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border-2 border-purple-300 bg-purple-100 px-2.5 py-1 font-mono text-xs font-bold text-purple-700 shadow-sm dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {issue.key}
            </span>
            <span
              className={`rounded-md border-2 px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusColorClasses(
                issue.statusColor
              )}`}
            >
              {issue.status}
            </span>
            {issue.priority && (
              <span
                className={`rounded-md border-2 px-2.5 py-1 text-xs font-semibold shadow-sm ${getPriorityColorClasses(
                  issue.priority
                )}`}
              >
                {issue.priority}
              </span>
            )}
          </div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            {issue.summary}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.back()}
            icon={ArrowLeft}
          >
            Geri
          </Button>
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md border-2 border-purple-600 bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-purple-700 hover:bg-purple-700 dark:border-purple-500 dark:bg-purple-600 dark:hover:border-purple-400 dark:hover:bg-purple-500"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Jira&apos;da Aç</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Left Column - Main Content */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              Açıklama
            </h2>
            {issue.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {issue.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bu issue için açıklama bulunmuyor.
              </p>
            )}
          </div>

          {/* Comments Section */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                Yorumlar
                {comments.length > 0 && (
                  <span className="rounded-md border-2 border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {comments.length}
                  </span>
                )}
              </h2>
            </div>

            {/* Add Comment Form */}
            <div className="mb-4 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Yorumunuzu yazın..."
                rows={3}
                maxLength={1000}
                className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-500 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-purple-500"
                disabled={addingComment}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {newComment.length}/1000
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addingComment}
                  loading={addingComment}
                  icon={Send}
                  className="!border-purple-600 !bg-purple-600 hover:!border-purple-700 hover:!bg-purple-700 dark:!border-purple-500 dark:!bg-purple-600 dark:hover:!border-purple-400 dark:hover:!bg-purple-500"
                >
                  Yorum Ekle
                </Button>
              </div>
            </div>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-md border-2 border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {comment.author.avatarUrls && (
                        <img
                          src={comment.author.avatarUrls["48x48"]}
                          alt={comment.author.displayName}
                          className="h-8 w-8 rounded-full border-2 border-gray-300 dark:border-gray-700"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {comment.author.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCommentDate(comment.created)}
                        </p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Henüz yorum yok. İlk yorumu siz ekleyin!
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-3">
          {/* Assignee */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Atanan
              </h3>
              <button
                onClick={() => setAssigneeModalOpen(true)}
                className="rounded-md border-2 border-transparent p-1 text-gray-400 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:text-gray-500 dark:hover:border-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                title="Atama değiştir"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            {issue.assignee ? (
              <div className="flex items-center gap-3">
                {issue.assignee.avatar && (
                  <img
                    src={issue.assignee.avatar}
                    alt={issue.assignee.name}
                    className="h-10 w-10 rounded-full border-2 border-gray-300 dark:border-gray-700"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {issue.assignee.name}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAssigneeModalOpen(true)}
                className="w-full rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
              >
                Atama yap
              </button>
            )}
          </div>

          {/* Status */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Durum
            </h3>
            <span
              className={`inline-block rounded-md border-2 px-3 py-1.5 text-xs font-semibold shadow-sm ${getStatusColorClasses(
                issue.statusColor
              )}`}
            >
              {issue.status}
            </span>
          </div>

          {/* Priority */}
          {issue.priority && (
            <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Öncelik
              </h3>
              <span
                className={`inline-block rounded-md border-2 px-3 py-1.5 text-xs font-semibold shadow-sm ${getPriorityColorClasses(
                  issue.priority
                )}`}
              >
                {issue.priority}
              </span>
            </div>
          )}

          {/* Type */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Tip
            </h3>
            <span className="inline-block rounded-md border-2 border-gray-300 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {issue.type}
            </span>
          </div>

          {/* Project */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Proje
            </h3>
            <a
              href={`/app/jira/${issue.project.key}`}
              className="inline-block rounded-md border-2 border-purple-300 bg-purple-100 px-3 py-1.5 font-mono text-xs font-semibold text-purple-700 shadow-sm transition hover:border-purple-400 hover:bg-purple-200 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
            >
              {issue.project.key}
            </a>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {issue.project.name}
            </p>
          </div>

          {/* Story Points */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Story Points
              </h3>
              {!storyPointsEditing && (
                <button
                  onClick={() => {
                    setStoryPointsEditing(true);
                    setStoryPointsInput(storyPoints !== null ? String(storyPoints) : "");
                  }}
                  className="rounded-md border-2 border-transparent p-1 text-gray-400 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:text-gray-500 dark:hover:border-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                  title="Puan düzenle"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
            </div>
            {storyPointsEditing ? (
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={storyPointsInput}
                  onChange={(e) => setStoryPointsInput(e.target.value)}
                  placeholder="Puan girin"
                  className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-base text-gray-900 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
                  disabled={storyPointsLoading}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={updateStoryPoints}
                    disabled={storyPointsLoading}
                    loading={storyPointsLoading}
                    className="!border-purple-600 !bg-purple-600 hover:!border-purple-700 hover:!bg-purple-700 dark:!border-purple-500 dark:!bg-purple-600 dark:hover:!border-purple-400 dark:hover:!bg-purple-500"
                  >
                    Kaydet
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setStoryPointsEditing(false);
                      setStoryPointsInput(storyPoints !== null ? String(storyPoints) : "");
                    }}
                    disabled={storyPointsLoading}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {storyPointsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : storyPoints !== null ? (
                  <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                    {storyPoints}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setStoryPointsEditing(true);
                      setStoryPointsInput("");
                    }}
                    className="text-sm text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                  >
                    Puan ekle
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Tarihler
            </h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>
                  <span className="font-semibold">Oluşturuldu:</span>{" "}
                  {formatDate(issue.created)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>
                  <span className="font-semibold">Güncellendi:</span>{" "}
                  {formatDate(issue.updated)}
                </span>
              </div>
              {issue.resolved && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3" />
                  <span>
                    <span className="font-semibold">Çözüldü:</span>{" "}
                    {formatDate(issue.resolved)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignee Modal */}
      <Modal
        open={assigneeModalOpen}
        onClose={() => {
          setAssigneeModalOpen(false);
          setAssigneeSearchQuery("");
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-bold">Atama Değiştir</span>
          </div>
        }
        className="sm:border-purple-600/30 dark:sm:border-purple-500/30"
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={assigneeSearchQuery}
              onChange={(e) => setAssigneeSearchQuery(e.target.value)}
              className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 pl-10 text-base text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-purple-500"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Users List */}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {assigneeLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-1/2 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Unassign Option */}
                {issue.assignee && (
                  <button
                    onClick={() => updateAssignee(null)}
                    disabled={assigneeLoading}
                    className="flex w-full items-center gap-3 rounded-md border-2 border-gray-300 bg-white p-3 text-left transition hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-red-700 dark:hover:bg-red-900/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                      <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Atamayı Kaldır
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Issue&apos;u atanmamış olarak işaretle
                      </p>
                    </div>
                  </button>
                )}

                {/* Users */}
                {filteredAssignableUsers.length > 0 ? (
                  filteredAssignableUsers.map((user) => (
                    <button
                      key={user.accountId}
                      onClick={() => updateAssignee(user.accountId)}
                      disabled={assigneeLoading}
                      className="flex w-full items-center gap-3 rounded-md border-2 border-gray-300 bg-white p-3 text-left transition hover:border-purple-400 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600 dark:hover:bg-purple-900/20"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="h-10 w-10 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-700"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-100 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {user.displayName}
                        </p>
                        {user.emailAddress && (
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {user.emailAddress}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {assigneeSearchQuery.trim() ? "Kullanıcı bulunamadı" : "Kullanıcı bulunamadı"}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}


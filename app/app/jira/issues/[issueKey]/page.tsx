"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ExternalLink,
  User,
  Clock,
  CheckCircle,
  Edit,
  X,
  Loader2,
  Search,
  MessageSquare,
  Send,
} from "lucide-react";
import { getStatusColorClasses, getPriorityColorClasses } from "@/lib/jira/colors";
import type { JiraTask, JiraComment } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconBadge from "@/components/ui/IconBadge";
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
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-96 animate-pulse rounded-lg border-2 border-border bg-card" />
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
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 text-sm text-destructive">
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
          <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">
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
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (issue.url) {
                window.open(issue.url, "_blank", "noopener,noreferrer");
              }
            }}
            icon={ExternalLink}
          >
            <span className="hidden sm:inline">Jira&apos;da Aç</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Left Column - Main Content */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-card-foreground sm:text-lg">
              Açıklama
            </h2>
            {issue.description ? (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {issue.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Bu issue için açıklama bulunmuyor.
              </p>
            )}
          </Card>

          {/* Comments Section */}
          <Card className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-card-foreground sm:text-lg">
                <IconBadge
                  icon={MessageSquare}
                  color="primary"
                  size="sm"
                />
                Yorumlar
                {comments.length > 0 && (
                  <span className="rounded-md border-2 border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground shadow-sm">
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
                className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={addingComment}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
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
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border-2 border-border bg-muted/50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {comment.author.avatarUrls && (
                        <Image
                          src={comment.author.avatarUrls["48x48"]}
                          alt={comment.author.displayName}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full border-2 border-border"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-card-foreground">
                          {comment.author.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCommentDate(comment.created)}
                        </p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Henüz yorum yok. İlk yorumu siz ekleyin!
              </p>
            )}
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-3">
          {/* Assignee */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-card-foreground">
                Atanan
              </h3>
              <button
                onClick={() => setAssigneeModalOpen(true)}
                className="rounded-md border-2 border-transparent p-1 text-muted-foreground transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"
                title="Atama değiştir"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            {issue.assignee ? (
              <div className="flex items-center gap-3">
                {issue.assignee.avatar && (
                  <Image
                    src={issue.assignee.avatar}
                    alt={issue.assignee.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border-2 border-border"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-card-foreground">
                    {issue.assignee.name}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAssigneeModalOpen(true)}
                className="w-full rounded-md border-2 border-dashed border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                Atama yap
              </button>
            )}
          </Card>

          {/* Status */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Durum
            </h3>
            <span
              className={`inline-block rounded-md border-2 px-3 py-1.5 text-xs font-semibold shadow-sm ${getStatusColorClasses(
                issue.statusColor
              )}`}
            >
              {issue.status}
            </span>
          </Card>

          {/* Priority */}
          {issue.priority && (
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">
                Öncelik
              </h3>
              <span
                className={`inline-block rounded-md border-2 px-3 py-1.5 text-xs font-semibold shadow-sm ${getPriorityColorClasses(
                  issue.priority
                )}`}
              >
                {issue.priority}
              </span>
            </Card>
          )}

          {/* Type */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Tip
            </h3>
            <span className="inline-block rounded-md border-2 border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              {issue.type}
            </span>
          </Card>

          {/* Project */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Proje
            </h3>
            <a
              href={`/app/jira/${issue.project.key}`}
              className="inline-block rounded-md border-2 border-purple-300 bg-purple-100 px-3 py-1.5 font-mono text-xs font-semibold text-purple-700 shadow-sm transition hover:border-purple-400 hover:bg-purple-200 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
            >
              {issue.project.key}
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              {issue.project.name}
            </p>
          </Card>

          {/* Story Points */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-card-foreground">
                Story Points
              </h3>
              {!storyPointsEditing && (
                <button
                  onClick={() => {
                    setStoryPointsEditing(true);
                    setStoryPointsInput(storyPoints !== null ? String(storyPoints) : "");
                  }}
                  className="rounded-md border-2 border-transparent p-1 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
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
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Puan ekle
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* Dates */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">
              Tarihler
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
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
          </Card>
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
              className="w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 pl-10 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* Users List */}
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {assigneeLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded-md bg-muted" />
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
                    className="flex w-full items-center gap-3 rounded-lg border-2 border-border bg-card p-3 text-left transition-all duration-200 hover:border-destructive hover:bg-destructive/10"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-muted">
                      <X className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-card-foreground">
                        Atamayı Kaldır
                      </p>
                      <p className="text-xs text-muted-foreground">
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
                      className="flex w-full items-center gap-3 rounded-lg border-2 border-border bg-card p-3 text-left transition-all duration-200 hover:border-primary hover:bg-primary/10"
                    >
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.displayName}
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-full border-2 border-border"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-muted text-sm font-bold text-muted-foreground">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-card-foreground">
                          {user.displayName}
                        </p>
                        {user.emailAddress && (
                          <p className="truncate text-xs text-muted-foreground">
                            {user.emailAddress}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
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


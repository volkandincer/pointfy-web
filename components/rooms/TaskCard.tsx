"use client";

import { memo, useEffect, useState, useMemo } from "react";
import { Link2, CheckCircle2, RefreshCw, Clock, BarChart3 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import Modal from "@/components/ui/Modal";
import { useToastContext } from "@/contexts/ToastContext";
import type { TaskInfo } from "@/interfaces/Voting.interface";

interface TaskCardProps {
  task: TaskInfo;
  roomId: string;
  isAdmin: boolean;
  onSetActive: (taskId: string) => Promise<void>;
}

const TaskCard = memo(function TaskCard({
  task,
  roomId,
  isAdmin,
  onSetActive,
}: TaskCardProps) {
  const { showToast } = useToastContext();
  const [votes, setVotes] = useState<
    Array<{ user_name: string; user_key: string; point: number | null }>
  >([]);
  const [loadingVotes, setLoadingVotes] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string | null>(null);
  const [storyPointsInput, setStoryPointsInput] = useState<number>(0);
  const [sendingStoryPoints, setSendingStoryPoints] = useState<boolean>(false);
  const [inputFocused, setInputFocused] = useState<boolean>(false);
  const [jiraStoryPoints, setJiraStoryPoints] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<
    "jira" | "average" | "manual"
  >("manual");

  // Jira base URL'i yükle
  useEffect(() => {
    let mounted = true;
    async function fetchJiraBaseUrl() {
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

    fetchJiraBaseUrl();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchVotes() {
      if (!task.id) return;
      setLoadingVotes(true);
      try {
        const supabase = getSupabase();
        // Task completed ise tüm puanları göster, değilse sadece admin görebilir
        const shouldShowAll =
          task.status === "completed" || (isAdmin && task.status === "active");

        if (shouldShowAll) {
          const { data } = await supabase
            .from("votes")
            .select("user_name, user_key, point")
            .eq("room_id", roomId)
            .eq("task_id", task.id);
          if (!mounted) return;
          setVotes(data || []);
        } else {
          setVotes([]);
        }
      } catch {
        // Fetch votes error
        if (!mounted) return;
        setVotes([]);
      } finally {
        if (mounted) setLoadingVotes(false);
      }
    }
    fetchVotes();

    // Realtime subscription for votes
    const supabase = getSupabase();
    const channel = supabase.channel(`task-votes-${task.id}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `task_id=eq.${task.id}`,
      },
      () => {
        fetchVotes();
      }
    );
    channel.subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [task.id, task.status, roomId, isAdmin]);

  const validVotes = votes.filter(
    (v) => v.point !== null && v.point !== undefined
  );
  const avgPointRaw =
    validVotes.length > 0
      ? validVotes.reduce((sum, v) => sum + (v.point || 0), 0) /
        validVotes.length
      : 0;
  const avgPoint = Math.round(avgPointRaw);

  // Jira'dan mevcut story point'i çek
  useEffect(() => {
    let mounted = true;
    async function fetchJiraStoryPoints() {
      if (
        task.status !== "completed" ||
        !isAdmin ||
        !task.jira_key ||
        !task.jira_id ||
        !jiraBaseUrl
      ) {
        return;
      }

      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();

        if (!mounted || !userData.user) {
          return;
        }

        // Jira base URL'i al (eğer state'te yoksa tekrar fetch et)
        let baseUrl = jiraBaseUrl;
        if (!baseUrl) {
          const { data: userRow } = await supabase
            .from("users")
            .select("jira_base_url")
            .eq("id", userData.user.id)
            .maybeSingle();
          baseUrl = userRow?.jira_base_url || null;
        }

        if (!baseUrl) {
          return;
        }

        const urlParams = new URLSearchParams();
        urlParams.set("userId", userData.user.id);
        urlParams.set("issueId", task.jira_id);
        urlParams.set("jiraBaseUrl", baseUrl);

        const response = await fetch(
          `/api/jira/get-story-points?${urlParams.toString()}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!mounted) return;

        if (
          response.ok &&
          data.storyPoints !== null &&
          data.storyPoints !== undefined
        ) {
          setJiraStoryPoints(data.storyPoints);
          // Jira'da puan varsa onu göster ve source'u jira yap
          if (!inputFocused) {
            setStoryPointsInput(data.storyPoints);
            setSelectedSource("jira");
          }
        } else {
          // Jira'da puan yoksa ortalama puanı göster ve source'u average yap
          if (!inputFocused && avgPoint > 0) {
            setStoryPointsInput(avgPoint);
            setSelectedSource("average");
          }
        }
      } catch {
        // Get Jira story points error
        // Hata durumunda ortalama puanı göster
        if (!inputFocused && avgPoint > 0) {
          setStoryPointsInput(avgPoint);
        }
      }
    }

    fetchJiraStoryPoints();

    return () => {
      mounted = false;
    };
  }, [
    task.status,
    task.jira_id,
    task.jira_key,
    isAdmin,
    jiraBaseUrl,
    inputFocused,
    avgPoint,
  ]);

  // Ortalama puan değiştiğinde input'u güncelle (eğer Jira'da puan yoksa ve input focus değilse)
  useEffect(() => {
    if (
      task.status === "completed" &&
      !inputFocused &&
      jiraStoryPoints === null &&
      avgPoint > 0 &&
      storyPointsInput === 0 &&
      selectedSource !== "manual"
    ) {
      setStoryPointsInput(avgPoint);
      setSelectedSource("average");
    }
  }, [
    task.status,
    avgPoint,
    storyPointsInput,
    inputFocused,
    jiraStoryPoints,
    selectedSource,
  ]);

  // Seçilen source'a göre input değerini güncelle
  const handleSourceSelect = (source: "jira" | "average") => {
    if (source === "jira" && jiraStoryPoints !== null && jiraStoryPoints > 0) {
      setStoryPointsInput(jiraStoryPoints);
      setSelectedSource("jira");
    } else if (source === "average" && avgPoint > 0) {
      setStoryPointsInput(avgPoint);
      setSelectedSource("average");
    }
  };

  // Input değeri değişti mi kontrol et
  const hasInputChanged = useMemo(() => {
    if (jiraStoryPoints !== null && jiraStoryPoints > 0) {
      // Jira'da puan varsa, input değeri Jira'daki puanla farklı mı?
      return Math.abs(storyPointsInput - jiraStoryPoints) > 0.01;
    } else if (avgPoint > 0) {
      // Jira'da puan yoksa, input değeri ortalama puanla farklı mı?
      return Math.abs(storyPointsInput - avgPoint) > 0.01;
    }
    // Hiç puan yoksa, input 0'dan büyükse değişiklik var
    return storyPointsInput > 0;
  }, [storyPointsInput, jiraStoryPoints, avgPoint]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Eğer tıklanan element bir buton, input veya link ise, card click'i çalıştırma
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.tagName === "A" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("a")
    ) {
      return;
    }

    // Pending task'lar için modal aç
    if (task.status === "pending" && isAdmin) {
      setShowConfirmModal(true);
      return;
    }

    // Completed task'lar için Jira'ya story point gönder (eğer Jira task'ı ise)
    if (
      task.status === "completed" &&
      isAdmin &&
      task.jira_key &&
      task.jira_id
    ) {
      // Puan varsa direkt gönder, yoksa input'tan değer girilmesini bekle
      if (validVotes.length > 0 && avgPoint > 0) {
        handleSendStoryPoints();
      }
      return;
    }
  };

  const handleSendStoryPoints = async () => {
    if (!task.jira_id || !jiraBaseUrl) {
      showToast("Jira bilgileri eksik", "error");
      return;
    }

    if (storyPointsInput < 0) {
      showToast("Story point negatif olamaz", "error");
      return;
    }

    setSendingStoryPoints(true);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      // Jira base URL'i al (eğer state'te yoksa tekrar fetch et)
      let baseUrl = jiraBaseUrl;
      if (!baseUrl) {
        const { data: userRow } = await supabase
          .from("users")
          .select("jira_base_url")
          .eq("id", userData.user.id)
          .maybeSingle();
        baseUrl = userRow?.jira_base_url || null;
      }

      if (!baseUrl) {
        throw new Error("Jira base URL bulunamadı");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("userId", userData.user.id);
      urlParams.set("jiraBaseUrl", baseUrl);

      const response = await fetch(
        `/api/jira/set-story-points?${urlParams.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            issueId: task.jira_id,
            storyPoints: storyPointsInput,
            jiraBaseUrl: baseUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Story point set edilemedi");
      }

      setJiraStoryPoints(storyPointsInput); // Jira'daki puanı güncelle
      showToast(
        `${
          task.jira_key || "Task"
        } için ${storyPointsInput} story point Jira'ya gönderildi`,
        "success"
      );
    } catch (err) {
      // Set story points error
      showToast(
        err instanceof Error ? err.message : "Story point set edilemedi",
        "error"
      );
    } finally {
      setSendingStoryPoints(false);
    }
  };

  const handleConfirmSetActive = async () => {
    setShowConfirmModal(false);
    await onSetActive(task.id);
  };

  return (
    <div
      className={`group relative overflow-hidden border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-4 shadow-sm transition-all duration-200 sm:p-5 ${
        task.status === "completed"
          ? "bg-green-50 dark:bg-green-900/20"
          : task.status === "active"
          ? "bg-blue-50 dark:bg-blue-900/20"
          : "bg-white dark:bg-gray-900"
      } ${
        (task.status === "pending" && isAdmin) ||
        (task.status === "completed" &&
          isAdmin &&
          task.jira_key &&
          task.jira_id)
          ? "cursor-pointer hover:border-gray-400 hover:shadow-md active:border-gray-400 active:shadow-md"
          : ""
      } dark:border-gray-700`}
      style={{
        borderLeftColor: task.status === "completed" ? '#16a34a' : task.status === "active" ? '#2563eb' : '#6b7280',
      }}
      onClick={handleCardClick}
      role={
        task.status === "completed" && isAdmin && task.jira_key && task.jira_id
          ? "button"
          : undefined
      }
      tabIndex={
        task.status === "completed" && isAdmin && task.jira_key && task.jira_id
          ? 0
          : undefined
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const mouseEvent = {
            target: e.target,
            currentTarget: e.currentTarget,
            stopPropagation: () => e.stopPropagation(),
            preventDefault: () => e.preventDefault(),
          } as React.MouseEvent<HTMLDivElement>;
          handleCardClick(mouseEvent);
        }
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {task.title}
            </h3>
            {task.jira_key && (
              <a
                href={task.jira_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border-2 border-blue-300 bg-blue-100 px-2.5 py-1 text-xs font-mono font-semibold text-blue-700 transition-all hover:bg-blue-200 hover:shadow-sm dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                onClick={(e) => {
                  if (!task.jira_url) {
                    e.preventDefault();
                  }
                }}
              >
                <Link2 className="h-3 w-3" />
                <span>{task.jira_key}</span>
              </a>
            )}
            {task.status === "completed" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Tamamlandı</span>
              </span>
            )}
            {task.status === "active" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Aktif</span>
              </span>
            )}
            {task.status === "pending" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <Clock className="h-3.5 w-3.5" />
                <span>Beklemede</span>
              </span>
            )}
          </div>
          {task.description && (
            <p className="mb-0 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Oluşturan */}
        <div className="rounded-md border-2 border-gray-200/50 bg-white/60 p-3 shadow-sm dark:border-gray-700/50 dark:bg-gray-800/60">
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Oluşturan
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {task.created_by_username || "Bilinmiyor"}
          </p>
        </div>

        {/* Tarih */}
        <div className="rounded-md border-2 border-gray-200/50 bg-white/60 p-3 shadow-sm dark:border-gray-700/50 dark:bg-gray-800/60">
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Oluşturulma
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {formatDate(task.created_at) || "-"}
          </p>
        </div>

        {/* Katılımcı Sayısı */}
        <div className="rounded-md border-2 border-gray-200/50 bg-white/60 p-3 shadow-sm dark:border-gray-700/50 dark:bg-gray-800/60">
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Katılımcı
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {loadingVotes ? (
              <span className="inline-block h-4 w-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
            ) : (
              votes.length
            )}
          </p>
        </div>

        {/* Ortalama Puan (sadece completed veya active task'larda) */}
        {(task.status === "completed" || task.status === "active") && (
          <div className="rounded-md border-2 border-gray-200/50 bg-white/60 p-3 shadow-sm dark:border-gray-700/50 dark:bg-gray-800/60">
            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Ortalama
            </p>
            {isAdmin &&
            task.status === "completed" &&
            task.jira_key &&
            task.jira_id ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={storyPointsInput || ""}
                    onChange={(e) => {
                      e.stopPropagation();
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setStoryPointsInput(value);
                        setSelectedSource("manual");
                      } else if (e.target.value === "") {
                        setStoryPointsInput(0);
                        setSelectedSource("manual");
                      }
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      setInputFocused(true);
                      // Input'u seç
                      const input = e.target as HTMLInputElement;
                      requestAnimationFrame(() => {
                        input.select();
                      });
                    }}
                    onBlur={() => {
                      setInputFocused(false);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 rounded-md border-2 border-blue-300 bg-white px-2 py-1 text-sm font-bold text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-blue-600 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-800"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Story Point
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {jiraStoryPoints !== null && jiraStoryPoints > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSourceSelect("jira");
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedSource === "jira"
                          ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      Jira&apos;da: {jiraStoryPoints}
                    </button>
                  )}
                  {avgPoint > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSourceSelect("average");
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedSource === "average"
                          ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      Ortalama: {avgPoint}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {loadingVotes ? (
                  <span className="inline-block h-4 w-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
                ) : avgPoint > 0 ? (
                  avgPoint
                ) : (
                  "-"
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Katılımcı Puanları (sadece admin ve completed/active task'larda) */}
      {isAdmin &&
        (task.status === "completed" || task.status === "active") &&
        votes.length > 0 && (
          <div className="mb-5 rounded-md border-2 border-gray-200/60 bg-white/80 p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-800/80">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Katılımcı Puanları
            </p>
            <div className="space-y-2">
              {votes.map((vote) => (
                <div
                  key={vote.user_key || vote.user_name}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900/50"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {vote.user_name}
                  </span>
                  <span className="rounded-md border-2 border-blue-300 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {vote.point ?? "Girilmedi"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Action Button */}
      <div className="flex items-center justify-between gap-3 border-t-2 border-gray-200/50 pt-4 dark:border-gray-700/50">
        {task.status === "completed" ? (
          <>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Bu task tamamlandı
            </span>
            <div className="flex items-center gap-2">
              {isAdmin && task.jira_key && task.jira_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendStoryPoints();
                  }}
                  disabled={
                    sendingStoryPoints ||
                    storyPointsInput < 0 ||
                    !hasInputChanged
                  }
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-md border-2 border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:border-blue-700 active:bg-blue-700 active:shadow-md hover:border-blue-700 hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                  title={
                    jiraStoryPoints !== null && jiraStoryPoints > 0
                      ? "Jira'daki Story Point'i Güncelle"
                      : "Jira'ya Story Point Gönder"
                  }
                >
                  {sendingStoryPoints ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      <span>
                        {jiraStoryPoints !== null && jiraStoryPoints > 0
                          ? "Güncelle"
                          : "Jira'ya Gönder"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        ) : task.status === "active" ? (
          <span className="inline-flex items-center gap-2 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <RefreshCw className="h-4 w-4" />
            <span>Şu anda puanlama yapılıyor</span>
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Card click event'ini durdur
              setShowConfirmModal(true);
            }}
            className="ml-auto rounded-md border-2 border-gray-900 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:border-gray-800 hover:bg-gray-800 hover:shadow-md dark:border-white dark:bg-white dark:text-gray-900 dark:hover:border-gray-100 dark:hover:bg-gray-100"
          >
            Puanlamaya Gönder
          </button>
        )}
      </div>

      {/* Onay Modal - Puanlamaya Gönder */}
      {task.status === "pending" && isAdmin && (
        <Modal
          open={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Task'ı Puanlamaya Gönder"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="font-semibold text-gray-900 dark:text-white">
                {task.title}
              </strong>{" "}
              task&apos;ını puanlamaya göndermek istediğinizden emin misiniz?
            </p>
            {task.description && (
              <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Açıklama:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {task.description}
                </p>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border-2 border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmSetActive}
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Puanlamaya Gönder
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
});

export default TaskCard;

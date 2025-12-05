"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { getSupabase } from "@/lib/supabase";

interface JiraStoryPointModalProps {
  open: boolean;
  onClose: () => void;
  issueId: string;
  issueKey: string;
  averagePoint: number;
  jiraBaseUrl?: string | null;
}

const JiraStoryPointModal = memo(function JiraStoryPointModal({
  open,
  onClose,
  issueId,
  issueKey,
  averagePoint,
  jiraBaseUrl,
}: JiraStoryPointModalProps) {
  const [storyPoints, setStoryPoints] = useState<number>(Math.round(averagePoint));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Ortalama puan değiştiğinde input'u güncelle
  useEffect(() => {
    if (open && averagePoint > 0) {
      setStoryPoints(Math.round(averagePoint));
      setError(null);
      setSuccess(false);
    }
  }, [open, averagePoint]);

  // Modal kapandığında state'i temizle
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!issueId || !jiraBaseUrl) {
      setError("Jira bilgileri eksik");
      return;
    }

    if (storyPoints < 0) {
      setError("Story point negatif olamaz");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("userId", userData.user.id);
      urlParams.set("jiraBaseUrl", jiraBaseUrl);

      const response = await fetch(`/api/jira/set-story-points?${urlParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          issueId,
          storyPoints,
          jiraBaseUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Story point set edilemedi");
      }

      setSuccess(true);
      
      // 2 saniye sonra modal'ı kapat
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      // Set story points error
      setError(err instanceof Error ? err.message : "Story point set edilemedi");
    } finally {
      setLoading(false);
    }
  }, [issueId, storyPoints, jiraBaseUrl, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Jira Story Point Set Et">
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Story point başarıyla Jira&apos;ya gönderildi!</span>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Issue
          </label>
          <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            {issueKey}
          </div>
        </div>

        <div>
          <label
            htmlFor="story-points"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Story Points
          </label>
          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Ortalama puan: {averagePoint.toFixed(1)} → Yuvarlanmış: {Math.round(averagePoint)}
          </div>
          <input
            id="story-points"
            type="number"
            min="0"
            step="0.5"
            value={storyPoints}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value) && value >= 0) {
                setStoryPoints(value);
              } else if (e.target.value === "") {
                setStoryPoints(0);
              }
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Story points"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-60"
          >
            {success ? "Kapat" : "İptal"}
          </button>
          {!success && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || storyPoints < 0}
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Gönderiliyor..." : "Jira'ya Gönder"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
});

export default JiraStoryPointModal;


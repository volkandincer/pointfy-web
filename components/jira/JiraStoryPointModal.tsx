"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
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
          <div className="flex items-center gap-2 rounded-lg border-2 border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive shadow-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg border-2 border-green-600/50 bg-green-600/10 p-3 text-sm text-green-600 dark:text-green-400 shadow-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Story point başarıyla Jira&apos;ya gönderildi!</span>
          </div>
        )}

        {/* Issue Info Card */}
        <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-card-foreground">
              Issue
            </label>
            <div className="rounded-md border-2 border-border bg-muted px-3 py-2 font-mono text-sm font-semibold text-card-foreground shadow-sm">
              {issueKey}
            </div>
          </div>
        </div>

        {/* Story Points Input Card */}
        <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
          <div className="relative">
            <label
              htmlFor="story-points"
              className="mb-2 block text-sm font-medium text-card-foreground"
            >
              Story Points
            </label>
            <div className="mb-3 rounded-md border-2 border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Ortalama puan: <span className="font-semibold text-card-foreground">{averagePoint.toFixed(1)}</span> → Yuvarlanmış: <span className="font-semibold text-card-foreground">{Math.round(averagePoint)}</span>
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
              className="w-full rounded-md border-2 border-input bg-background px-3 py-2 text-card-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Story points"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-border">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            {success ? "Kapat" : "İptal"}
          </Button>
          {!success && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={loading || storyPoints < 0}
              loading={loading}
            >
              {loading ? "Gönderiliyor..." : "Jira'ya Gönder"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
});

export default JiraStoryPointModal;


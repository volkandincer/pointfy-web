"use client";

import { memo, useState, useEffect } from "react";
import { RefreshCw, Pause, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { getSupabase } from "@/lib/supabase";
import VotingCardGrid from "./VotingCardGrid";
import { useVotes } from "@/hooks/useVotes";
import { useVotingSession } from "@/hooks/useVotingSession";
import type { TaskInfo } from "@/interfaces/Voting.interface";

interface UserVotingViewProps {
  roomId: string;
  activeTask: TaskInfo;
  userKey: string;
  username: string;
}

const UserVotingView = memo(function UserVotingView({
  roomId,
  activeTask,
  userKey,
  username,
}: UserVotingViewProps) {
  const router = useRouter();
  const { votes, loading: votesLoading } = useVotes(
    roomId,
    activeTask.id,
    false
  );
  const { remainingTime, isVotingActive } = useVotingSession(roomId);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const hasVoted = votes.some(
    (v) => v.user_key === userKey || v.user_name === username
  );

  useEffect(() => {
    const myVote = votes.find(
      (v) => v.user_key === userKey || v.user_name === username
    );
    if (myVote?.point !== null && myVote?.point !== undefined) {
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        setSelectedPoint(myVote.point);
      }, 0);
    }
  }, [votes, userKey, username]);

  useEffect(() => {
    if (activeTask.status === "completed") {
      setTimeout(() => {
        router.refresh();
      }, 3000);
    }
  }, [activeTask.status, router]);

  const handleVote = async (point: number) => {
    if (!activeTask || !isVotingActive) return;
    setSelectedPoint(point);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("votes").upsert({
        room_id: roomId,
        user_name: username,
        user_key: userKey,
        point,
        task_id: activeTask.id,
      });
      if (error) {
        // Vote error
        setSelectedPoint(null);
      }
    } catch {
      // Vote exception
      setSelectedPoint(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-card-foreground">
            {activeTask.title}
          </h2>
          <span className="flex items-center gap-1.5 rounded-md border-2 border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            {isVotingActive ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Aktif
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                Beklemede
              </>
            )}
          </span>
        </div>
        {activeTask.description && (
          <p className="mb-4 text-muted-foreground">
            {activeTask.description}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">
              Toplam Katılımcı
            </span>
            <p className="font-semibold text-card-foreground">
              {votes.length}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">
              Senin Puanın
            </span>
            <p className="font-semibold text-card-foreground">
              {selectedPoint ?? "Henüz puanlanmadı"}
            </p>
          </div>
        </div>
      </Card>

      {isVotingActive && (
        <Card padding="lg">
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground">
              Kalan Süre
            </p>
            <p className="text-3xl font-bold text-card-foreground">
              {remainingTime} saniye
            </p>
          </div>
          {remainingTime === 0 && votes.length === 0 && (
            <div className="mt-4 rounded-md border-2 border-primary/50 bg-primary/10 p-3">
              <p className="text-xs font-semibold text-primary">
                ⏱️ Süre doldu ve henüz puan verilmedi
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Admin yeni bir task seçebilir veya oylamayı iptal edebilir
              </p>
            </div>
          )}
        </Card>
      )}

      {isVotingActive && (
        <Card padding="lg">
          <VotingCardGrid
            selectedPoint={selectedPoint}
            hasVoted={hasVoted}
            isVotingActive={isVotingActive}
            onVote={handleVote}
          />
        </Card>
      )}

      <Card padding="lg">
        <h3 className="mb-4 text-lg font-semibold text-card-foreground">
          Katılımcı Puanları
        </h3>
        {votesLoading ? (
          <p className="text-sm text-muted-foreground">
            Yükleniyor...
          </p>
        ) : votes.length === 0 ? (
          <div className="py-8 text-center">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium text-card-foreground">
              Henüz puan yok
            </p>
            <p className="text-xs text-muted-foreground">
              Katılımcılar puan vermeye başladığında burada görünecek
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {votes.map((vote) => (
              <div
                key={vote.user_key || vote.user_name}
                className="flex items-center justify-between rounded-md border-2 border-border bg-muted p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-card-foreground">
                    {vote.user_name}
                  </span>
                  {vote.user_key === userKey && (
                    <span className="rounded-md border-2 border-primary/50 bg-primary/10 px-2 py-0.5 text-xs text-primary shadow-sm">
                      Sen
                    </span>
                  )}
                </div>
                <span className="font-semibold text-card-foreground">
                  {vote.point ?? "Girilmedi"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
});

export default UserVotingView;

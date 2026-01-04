"use client";

import { memo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FIBONACCI_POINTS } from "@/interfaces/Voting.interface";

interface VotingCardGridProps {
  selectedPoint: number | null;
  hasVoted: boolean;
  isVotingActive: boolean;
  onVote: (point: number) => Promise<void>;
}

const VotingCardGrid = memo(function VotingCardGrid({
  selectedPoint,
  hasVoted,
  isVotingActive,
  onVote,
}: VotingCardGridProps) {
  const [loadingPoint, setLoadingPoint] = useState<number | null>(null);

  const handleClick = async (point: number) => {
    if (hasVoted || !isVotingActive || loadingPoint !== null) return;
    setLoadingPoint(point);
    try {
      await onVote(point);
    } finally {
      setLoadingPoint(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-card-foreground">
        Puanını Seç
      </h3>
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-7">
        {FIBONACCI_POINTS.map((point) => {
          const isSelected = selectedPoint === point;
          const isDisabled =
            (hasVoted && !isSelected) ||
            !isVotingActive ||
            loadingPoint !== null;
          return (
            <button
              key={point}
              onClick={() => handleClick(point)}
              disabled={isDisabled}
              className={`group relative overflow-hidden rounded-lg border-l-4 ${
                isSelected
                  ? "border-l-primary dark:border-l-primary"
                  : "border-l-border"
              } border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 px-4 py-6 text-xl font-bold shadow-md transition-all duration-300 ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : isDisabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:scale-[1.05] hover:border-border hover:shadow-xl"
              }`}
            >
              {/* Glow Effect */}
              {isSelected && (
                <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 blur-xl transition-all group-hover:scale-150" />
              )}
              
              {/* Content */}
              <span className="relative z-10">
                {loadingPoint === point ? (
                  <span className="text-sm">...</span>
                ) : (
                  point
                )}
              </span>
            </button>
          );
        })}
      </div>
      {hasVoted && (
        <p className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Puanını verdin! Diğer katılımcıları bekle
        </p>
      )}
    </div>
  );
});

export default VotingCardGrid;

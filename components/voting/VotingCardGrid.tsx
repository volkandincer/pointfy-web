"use client";

import { memo, useState } from "react";
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
              className={`relative rounded-2xl border-2 px-4 py-6 text-xl font-bold transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg scale-105"
                  : isDisabled
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                  : "border-gray-300 bg-white text-gray-900 hover:border-blue-400 hover:bg-blue-50 hover:scale-105 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:border-blue-500 dark:hover:bg-gray-800"
              }`}
            >
              {isSelected && (
                <div className="absolute inset-0 rounded-2xl bg-blue-600 animate-pulse opacity-20" />
              )}
              {loadingPoint === point ? (
                <span className="text-sm">...</span>
              ) : (
                point
              )}
            </button>
          );
        })}
      </div>
      {hasVoted && (
        <p className="text-sm text-green-600 dark:text-green-400">
          ✅ Puanını verdin! Diğer katılımcıları bekle
        </p>
      )}
    </div>
  );
});

export default VotingCardGrid;

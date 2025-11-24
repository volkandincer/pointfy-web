"use client";

import { memo, useEffect } from "react";
import type { JiraTask } from "@/interfaces/Jira.interface";

interface JiraIssueModalProps {
  issue: JiraTask | null;
  isOpen: boolean;
  onClose: () => void;
}

const JiraIssueModal = memo(function JiraIssueModal({
  issue,
  isOpen,
  onClose,
}: JiraIssueModalProps) {
  // Modal açıkken body scroll'unu disable et
  useEffect(() => {
    if (isOpen) {
      // Scroll pozisyonunu kaydet
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Scroll pozisyonunu geri yükle
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      // Cleanup
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
      onTouchMove={(e) => {
        // Modal içindeki scroll'u sayfa scroll'undan ayır
        e.stopPropagation();
      }}
    >
      <div
        className="relative w-full max-w-3xl my-8 rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                  {issue.key}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    issue.statusColor === "green"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : issue.statusColor === "yellow"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : issue.statusColor === "blue-gray"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {issue.status}
                </span>
                {issue.priority && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {issue.priority}
                  </span>
                )}
                {issue.type && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    {issue.type}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {issue.summary}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="ml-4 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          className="max-h-[calc(100vh-200px)] overflow-y-auto p-6 overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Description */}
          {issue.description && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Açıklama
              </h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {issue.description}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {issue.project && (
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Proje
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {issue.project.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {issue.project.key}
                </div>
              </div>
            )}

            {issue.assignee && (
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Atanan
                </div>
                <div className="flex items-center gap-2">
                  {issue.assignee.avatar && (
                    <img
                      src={issue.assignee.avatar}
                      alt={issue.assignee.name}
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {issue.assignee.name}
                  </div>
                </div>
              </div>
            )}

            {issue.created && (
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Oluşturulma
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Date(issue.created).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(issue.created).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}

            {issue.updated && (
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Son Güncelleme
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Date(issue.updated).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(issue.updated).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}

            {issue.resolved && (
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Çözüldü
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Date(issue.resolved).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <span>Jira'da Aç</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default JiraIssueModal;


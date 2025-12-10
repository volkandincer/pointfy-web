"use client";

import Image from "next/image";
import { memo, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import Button from "@/components/ui/Button";
import type { JiraTask } from "@/interfaces/Jira.interface";
import { getStatusColorClasses, getPriorityColorClasses } from "@/lib/jira/colors";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/utils/scrollLock";

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
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }

    return () => {
      // Cleanup - sadece modal açıkken cleanup yap
      if (isOpen) {
        unlockBodyScroll();
      }
    };
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
      onTouchStart={(e) => {
        // Backdrop'a dokunulduğunda scroll'u engelle
        const target = e.target as HTMLElement;
        if (target.classList.contains("fixed") || target.classList.contains("bg-black")) {
          e.preventDefault();
        }
      }}
      onTouchMove={(e) => {
        // Modal backdrop'unda scroll'u engelle
        const target = e.target as HTMLElement;
        if (target.classList.contains("fixed") || target.classList.contains("bg-black")) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="relative w-full max-w-3xl my-8 rounded-md border-2 border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          // Modal içindeki touch event'lerini sayfa scroll'undan ayır
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          // Modal içindeki scroll'u sayfa scroll'undan ayır
          e.stopPropagation();
        }}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {/* Header */}
        <div className="border-b-2 border-gray-200 p-6 dark:border-gray-800">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                  {issue.key}
                </span>
                <span
                  className={`rounded-md border-2 px-3 py-1 text-xs font-semibold shadow-sm ${getStatusColorClasses(issue.statusColor || "gray")}`}
                >
                  {issue.status}
                </span>
                {issue.priority && (
                  <span className={`rounded-md border-2 px-3 py-1 text-xs font-medium shadow-sm ${getPriorityColorClasses(issue.priority)}`}>
                    {issue.priority}
                  </span>
                )}
                {issue.type && (
                  <span className="rounded-md border-2 border-purple-300 bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 shadow-sm dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
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
              className="ml-4 rounded-md border-2 border-gray-300 bg-white p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:border-gray-400 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
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
              <div className="border-2 border-gray-300 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
                    <Image
                      src={issue.assignee.avatar}
                      alt={issue.assignee.name}
                      width={24}
                      height={24}
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
        <div className="border-t-2 border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <Button
              variant="primary"
              size="md"
              href={issue.url}
              asLink
              icon={ExternalLink}
              iconPosition="right"
              className="!border-0"
            >
              Jira&apos;da Aç
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default JiraIssueModal;


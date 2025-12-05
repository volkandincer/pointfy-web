"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { useToastContext } from "@/contexts/ToastContext";
import { resolveEnvValue } from "@/lib/appEnvironment";

interface ShareRoomButtonProps {
  roomId: string;
  roomCode: string;
  roomName: string;
}

const ShareRoomButton = memo(function ShareRoomButton({
  roomId,
  roomCode,
  roomName,
}: ShareRoomButtonProps) {
  const { showToast } = useToastContext();
  const [copied, setCopied] = useState<boolean>(false);

  const shareUrl = useMemo(() => {
    if (!roomId) return "";
    
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      currentUrl.pathname = `/app/rooms/${roomId}`;
      currentUrl.search = "";
      return currentUrl.toString();
    }
    
    const baseUrl = resolveEnvValue("NEXT_PUBLIC_SITE_URL") || "";
    return baseUrl ? `${baseUrl}/app/rooms/${roomId}` : "";
  }, [roomId]);

  const handleShare = useCallback(async () => {
    if (!shareUrl || !roomId) {
      showToast("Oda linki oluşturulamadı.", "error");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        const shareData = {
          title: `Pointfy Odasına Katıl: ${roomName}`,
          text: `${roomName} odasına katılmak için linke tıklayın!\n\nOda Kodu: ${roomCode}\n\nLink: ${shareUrl}`,
          url: shareUrl,
        };
        
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          showToast(`Paylaşım başarılı! Link: ${shareUrl}`, "success", 5000);
          return;
        } else if (!navigator.canShare) {
          await navigator.share(shareData);
          showToast(`Paylaşım başarılı! Link: ${shareUrl}`, "success", 5000);
          return;
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast(`Link kopyalandı: ${shareUrl}`, "success", 5000);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setCopied(true);
          showToast(`Link kopyalandı: ${shareUrl}`, "success", 5000);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          showToast(`Link: ${shareUrl}`, "info", 10000);
        }
      }
    }
  }, [shareUrl, roomName, roomCode, roomId, showToast]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      title="Odayı Paylaş"
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-green-600">Kopyalandı!</span>
        </>
      ) : (
        <>
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span>Paylaş</span>
        </>
      )}
    </button>
  );
});

export default ShareRoomButton;


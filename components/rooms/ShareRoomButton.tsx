"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { Check, Share2 } from "lucide-react";
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
      className="flex items-center gap-2 rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      title="Odayı Paylaş"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-green-600 dark:text-green-400">Kopyalandı!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>Paylaş</span>
        </>
      )}
    </button>
  );
});

export default ShareRoomButton;


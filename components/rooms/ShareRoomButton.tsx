"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { Check, Share2 } from "lucide-react";
import Button from "@/components/ui/Button";
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
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      icon={copied ? Check : Share2}
      className={`!h-8 !px-3 !text-xs ${copied 
        ? "!border-green-300 !text-green-600 hover:!border-green-400 hover:!bg-green-50 dark:!border-green-500 dark:!text-green-400 dark:hover:!bg-green-900/20"
        : ""
      }`}
      title="Odayı Paylaş"
    >
      {copied ? "Kopyalandı!" : "Paylaş"}
    </Button>
  );
});

export default ShareRoomButton;


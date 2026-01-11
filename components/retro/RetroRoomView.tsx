"use client";

import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Timer, Layers, Angry, Frown, Smile, PartyPopper, Lock, Send, Edit, Trash2, Plus, CheckCircle2, Play } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useRetroCards } from "@/hooks/useRetroCards";
import { useRetroTimer } from "@/hooks/useRetroTimer";
import { useRetroSession } from "@/hooks/useRetroSession";
import { useToastContext } from "@/contexts/ToastContext";
import EmptyState from "@/components/jira/EmptyState";
import type { RetroCategory, RetroCard } from "@/interfaces/Retro.interface";
import RetroCardModal from "./RetroCardModal";
import RetroActionItems from "./RetroActionItems";
import RetroActionItemModal from "./RetroActionItemModal";
import { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { RetroActionItemInput } from "@/interfaces/RetroActionItem.interface";
import { useRoomCustomFlags } from "@/hooks/useRoomCustomFlags";
import { UseCaseFactory } from "@/src/application/services/UseCaseFactory";

interface RetroRoomViewProps {
  roomId: string;
  userKey: string;
  username: string;
  isAdmin: boolean;
}

const getCategoryInfo = (category: RetroCategory) => {
  switch (category) {
    case "mad":
      return { title: "Mad", color: "red", icon: Angry };
    case "sad":
      return { title: "Sad", color: "blue", icon: Frown };
    case "glad":
      return { title: "Glad", color: "green", icon: Smile };
  }
};

const RetroRoomView = memo(function RetroRoomView({
  roomId,
  userKey,
  username,
  isAdmin,
}: RetroRoomViewProps) {
  const { cards, loading, refresh: refreshCards } = useRetroCards(roomId);
  const { showToast } = useToastContext();
  const { customFlags, addCustomFlag } = useRoomCustomFlags(roomId, isAdmin);
  const {
    remainingSeconds,
    isActive: timerActive,
    isWarning: timerWarning,
    startTimer,
    stopTimer,
  } = useRetroTimer(roomId, isAdmin);
  const {
    session: activeSession,
    loading: sessionLoading,
    createSession,
    completeSession,
  } = useRetroSession(roomId, isAdmin);
  const [formCategory, setFormCategory] = useState<RetroCategory>("glad");
  const [viewCategory, setViewCategory] = useState<RetroCategory>("glad");
  const [editingCard, setEditingCard] = useState<RetroCard | null>(null);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [cardContent, setCardContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [warningShown, setWarningShown] = useState<boolean>(false);
  const [showAddActionModal, setShowAddActionModal] = useState<boolean>(false);
  const [selectedCardForAction, setSelectedCardForAction] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const timerOptions = [
    { label: "15 Saniye", seconds: 15, minutes: 0.25 },
    { label: "1 Dakika", seconds: 60, minutes: 1 },
    { label: "3 Dakika", seconds: 180, minutes: 3 },
    { label: "5 Dakika", seconds: 300, minutes: 5 },
    { label: "10 Dakika", seconds: 600, minutes: 10 },
  ];

  const cardsRevealed = useMemo(
    () => cards.length > 0 && cards.every((card) => card.is_revealed),
    [cards]
  );

  const categoryCards = useMemo(
    () => cards.filter((card) => card.category === viewCategory),
    [cards, viewCategory]
  );

  const revealedCards = useMemo(
    () => categoryCards.filter((card) => card.is_revealed),
    [categoryCards]
  );

  const hiddenCards = useMemo(
    () => categoryCards.filter((card) => !card.is_revealed),
    [categoryCards]
  );

  // Timer uyarısı için effect
  useEffect(() => {
    if (timerWarning && !warningShown && timerActive) {
      showToast("Son 10 saniye! Son kartınızı göndermek için zamanınız kaldı!", "info", 10000);
      setWarningShown(true);
    }
    if (!timerWarning) {
      setWarningShown(false);
    }
  }, [timerWarning, timerActive, warningShown, showToast]);

  const handleAddCard = useCallback(
    async (category: RetroCategory, content: string) => {
      if (cardsRevealed) {
        showToast("Kartlar açıldıktan sonra yeni kart eklenemez!", "error");
        return;
      }

      // Admin için süre başlatmadan kart göndermeyi engelle
      if (isAdmin && !timerActive) {
        showToast("⏱️ Lütfen önce süreyi başlatın!", "error");
        return;
      }

      // Timer aktifse ve süre dolmuşsa engelle
      if (timerActive && remainingSeconds === 0) {
        showToast("Süre doldu! Artık kart eklenemez.", "error");
        return;
      }

      if (!content.trim()) {
        showToast("Lütfen kart içeriğini girin.", "error");
        return;
      }

      setIsSubmitting(true);
      try {
        const createRetroCardUseCase = UseCaseFactory.createRetroCard();
        await createRetroCardUseCase.execute({
          roomId,
          userId: userKey,
          userName: username,
          category,
          content: content.trim(),
        });

        setCardContent("");
        textareaRef.current?.focus();
        // Başarı mesajı gereksiz - kullanıcı kartı zaten görüyor
      } catch (err) {
        showToast("Kart eklenirken bir hata oluştu.", "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomId, userKey, username, cardsRevealed, timerActive, remainingSeconds, isAdmin, showToast]
  );

  const handleStartTimer = useCallback(async () => {
    if (selectedDuration === null) {
      showToast("Lütfen bir süre seçin!", "error");
      return;
    }
    const option = timerOptions.find((opt) => opt.minutes === selectedDuration);
    if (!option) return;
    
    await startTimer(option.seconds); // Artık saniye cinsinden gönderiyoruz
    setShowTimerModal(false);
    setSelectedDuration(null);
    // Başarı mesajı gereksiz - timer zaten görünüyor
  }, [startTimer, selectedDuration, showToast, timerOptions]);

  const handleSubmitCard = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await handleAddCard(formCategory, cardContent);
    },
    [formCategory, cardContent, handleAddCard]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmitCard(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    },
    [handleSubmitCard]
  );

  const handleEditCard = useCallback(
    async (cardId: string, content: string) => {
      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("retro_cards")
          .update({
            content: content.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", cardId);

        if (error) throw error;
        setEditingCard(null);
        // Başarı mesajı gereksiz - kullanıcı değişikliği zaten görüyor
      } catch (err) {
        showToast("Kart güncellenirken bir hata oluştu.", "error");
      }
    },
    [showToast]
  );

  const handleDeleteCard = useCallback(
    async (card: RetroCard) => {
      if (card.user_key !== userKey) {
        showToast("Sadece kendi kartlarınızı silebilirsiniz.", "error");
        return;
      }

      if (!confirm("Bu kartı silmek istediğinizden emin misiniz?")) return;

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("retro_cards")
          .delete()
          .eq("id", card.id);

        if (error) throw error;
        // Başarı mesajı gereksiz - kullanıcı kartın silindiğini zaten görüyor
      } catch (err) {
        showToast("Kart silinirken bir hata oluştu.", "error");
      }
    },
    [userKey, showToast]
  );

  const handleRevealAll = useCallback(async () => {
    if (!isAdmin) return;
    setIsRevealing(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.rpc("reveal_all_retro_cards", {
        room_id_param: roomId,
      });
      if (error) throw error;
      // Timer'ı kapat
      if (timerActive) {
        stopTimer();
      }
      // Başarı mesajı gereksiz - kullanıcı kartların açıldığını zaten görüyor
    } catch (err) {
      showToast("Kartlar açılırken bir hata oluştu.", "error");
    } finally {
      setIsRevealing(false);
    }
  }, [roomId, isAdmin, showToast, timerActive, stopTimer]);

  const handleOpenEdit = useCallback(
    (card: RetroCard) => {
      if (card.user_key !== userKey) {
        showToast("Sadece kendi kartlarınızı düzenleyebilirsiniz.", "error");
        return;
      }
      setEditingCard(card);
    },
    [userKey, showToast]
  );

  const handleStartNewSession = useCallback(async () => {
    if (!isAdmin) return;
    // Aktif session varsa yeni session başlatılamaz
    if (activeSession && activeSession.is_active) {
      showToast("Önce mevcut retro session'ını tamamlamanız gerekiyor.", "error");
      return;
    }
    try {
      await createSession();
      // Başarı mesajı gereksiz - kullanıcı yeni session'ı zaten görüyor
    } catch (err) {
      showToast("Yeni session başlatılırken bir hata oluştu.", "error");
    }
  }, [isAdmin, activeSession, createSession, showToast]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session Info & New Session Button - Only show if active session */}
      {isAdmin && activeSession && activeSession.is_active && (
        <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 shrink-0 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                Aktif Retro Session
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(activeSession.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Retro Başlat Button - Show when no active session */}
      {isAdmin && (!activeSession || !activeSession.is_active) && !sessionLoading && (
        <div className="flex justify-end">
          <Button
            onClick={handleStartNewSession}
            variant="outline"
            size="sm"
            icon={Play}
            className="!h-7 !px-2.5 !text-xs"
          >
            Yeni Retro Başlat
          </Button>
        </div>
      )}

      {/* Status & Timer Section - Minimal */}
      <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timer Display - Redesigned */}
          {timerActive && (
            <div className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-all ${
              timerWarning
                ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
            }`}>
              <Timer className={`h-4 w-4 shrink-0 ${
                timerWarning
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
              }`} />
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xs font-medium ${
                  timerWarning
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}>
                  Kalan:
                </span>
                <p className={`text-sm font-bold tabular-nums ${
                  timerWarning
                    ? "text-red-700 dark:text-red-300"
                    : "text-blue-700 dark:text-blue-300"
                }`}>
                  {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, "0")}
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={stopTimer}
                  variant="ghost"
                  size="sm"
                  className="ml-auto !h-6 !px-2 !text-xs !text-gray-600 hover:!bg-gray-100 dark:!text-gray-400 dark:hover:!bg-gray-800"
                >
                  Bitir
                </Button>
              )}
            </div>
          )}

          {/* Status Display - Only show if active session */}
          {activeSession && activeSession.is_active && (
            <>
              {cardsRevealed ? (
                <div className="flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-2.5 py-1.5 dark:border-green-800 dark:bg-green-950/30">
                  <PartyPopper className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">
                    Tüm kartlar açıldı
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                  <Layers className="h-3.5 w-3.5 shrink-0 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {revealedCards.length} açık
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {hiddenCards.length} gizli
                  </span>
                </div>
              )}
            </>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className="ml-auto flex items-center gap-1.5">
              {activeSession && activeSession.is_active && !cardsRevealed && !timerActive && (
                <Button
                  onClick={() => setShowTimerModal(true)}
                  variant="primary"
                  size="sm"
                  icon={Timer}
                  className="!h-7 !px-2.5 !text-xs"
                >
                  Süre Başlat
                </Button>
              )}
              {!cardsRevealed && hiddenCards.length > 0 && (
                <Button
                  onClick={handleRevealAll}
                  disabled={isRevealing}
                  variant="primary"
                  size="sm"
                  icon={Layers}
                  loading={isRevealing}
                  className="!h-7 !px-2.5 !text-xs !border-green-600 !bg-green-600 hover:!border-green-700 hover:!bg-green-700 dark:!border-green-500 dark:!bg-green-600 dark:hover:!border-green-400 dark:hover:!bg-green-500"
                >
                  Aç
                </Button>
              )}
              {cardsRevealed && activeSession && activeSession.is_active && (
                <Button
                  onClick={async () => {
                    if (!activeSession) return;
                    try {
                      await completeSession();
                      // Kartları yeniden fetch et (silinen kartlar için)
                      await refreshCards();
                      // Başarı mesajı gereksiz - kullanıcı toplantının tamamlandığını zaten görüyor
                    } catch (err) {
                      showToast("Toplantı tamamlanırken bir hata oluştu.", "error");
                    }
                  }}
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  className="!h-7 !px-2.5 !text-xs !border-blue-600 !bg-blue-600 hover:!border-blue-700 hover:!bg-blue-700 dark:!border-blue-500 dark:!bg-blue-600 dark:hover:!border-blue-400 dark:hover:!bg-blue-500"
                >
                  Toplantıyı Tamamla
                </Button>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Add Card Form - Clean & Minimal */}
      {activeSession && activeSession.is_active && !cardsRevealed && (
        <form
          onSubmit={handleSubmitCard}
          className={`rounded-md border p-3 transition-all ${
            isAdmin && !timerActive
              ? "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              : timerActive && remainingSeconds === 0
              ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
              : timerWarning
              ? "border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
              : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
          }`}
        >
          {/* Category Selection - Inside Form */}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Kategori
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(["mad", "sad", "glad"] as RetroCategory[]).map((category) => {
                const info = getCategoryInfo(category);
                const isSelected = formCategory === category;
                const getColor = () => {
                  if (info.color === "red") {
                    return { 
                      border: "var(--destructive)", 
                      bg: "oklch(0.98 0.01 25)",
                      hover: "oklch(0.96 0.02 25)",
                      text: "var(--destructive)"
                    };
                  }
                  if (info.color === "blue") {
                    return { 
                      border: "var(--primary)", 
                      bg: "oklch(0.98 0.01 250)",
                      hover: "oklch(0.96 0.02 250)",
                      text: "var(--primary)"
                    };
                  }
                  return { 
                    border: "oklch(0.6 0.2 145)", 
                    bg: "oklch(0.98 0.01 145)",
                    hover: "oklch(0.96 0.02 145)",
                    text: "oklch(0.6 0.2 145)"
                  };
                };
                const color = getColor();

                return (
                  <Button
                    key={category}
                    type="button"
                    onClick={() => setFormCategory(category)}
                    variant={isSelected ? "primary" : "outline"}
                    size="sm"
                    icon={info.icon}
                    iconPosition="left"
                    className={`transition-all duration-200 ${
                      isSelected 
                        ? "" 
                        : "!border-gray-200 !bg-white !text-gray-700 hover:!border-gray-300 hover:!bg-gray-50 dark:!border-gray-700 dark:!bg-gray-900 dark:!text-gray-300 dark:hover:!border-gray-600 dark:hover:!bg-gray-800"
                    }`}
                    style={isSelected ? {
                      borderColor: color.border,
                      backgroundColor: color.bg,
                      color: color.text,
                    } : {}}
                  >
                    {info.title}
                  </Button>
                );
              })}
            </div>
          </div>

            {/* Modern Card Design for Input and Button */}
            <div className={`relative overflow-hidden rounded-xl border-2 shadow-lg transition-all duration-300 ${
              isAdmin && !timerActive
                ? "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900"
                : timerActive && remainingSeconds === 0
                ? "border-red-300 bg-gradient-to-br from-red-50 to-red-100 dark:border-red-800 dark:from-red-950/30 dark:to-red-900/20"
                : timerWarning
                ? "border-orange-400 bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50 shadow-orange-200/50 dark:border-orange-600 dark:from-orange-950/40 dark:via-orange-900/30 dark:to-amber-950/40 dark:shadow-orange-900/20"
                : "border-primary/30 bg-gradient-to-br from-white via-primary/5 to-primary/10 shadow-primary/10 dark:border-primary/40 dark:from-gray-900 dark:via-primary/10 dark:to-primary/20 dark:shadow-primary/20"
            }`}>
              {/* Decorative Background Pattern */}
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}></div>
              </div>
              
              <div className="relative p-4">
                <div className="flex flex-col gap-3">
                  {/* Text Input with Enhanced Design */}
                  <div className="relative">
                    <div className={`absolute -inset-0.5 rounded-lg blur-sm opacity-20 transition-opacity ${
                      timerWarning
                        ? "bg-orange-500"
                        : "bg-primary"
                    }`}></div>
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={cardContent}
                        onChange={(e) => setCardContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`${getCategoryInfo(formCategory).title} kategorisine kart ekle...`}
                        rows={2}
                        disabled={isSubmitting || (isAdmin && !timerActive) || (timerActive && remainingSeconds === 0)}
                        size="md"
                        className={`relative z-10 w-full text-base transition-all duration-200 ${
                          isAdmin && !timerActive
                            ? "border-gray-300 bg-white/80 text-gray-500 cursor-not-allowed backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800/80"
                            : timerActive && remainingSeconds === 0
                            ? "border-red-300 bg-white/80 text-gray-500 cursor-not-allowed backdrop-blur-sm dark:border-red-700 dark:bg-gray-800/80"
                            : timerWarning
                            ? "border-orange-400 bg-white/90 text-gray-900 shadow-md shadow-orange-200/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 dark:border-orange-600 dark:bg-gray-800/90 dark:text-white dark:shadow-orange-900/30 dark:focus:ring-orange-500/40"
                            : "border-primary/40 bg-white/90 text-gray-900 shadow-md shadow-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:border-primary/50 dark:bg-gray-800/90 dark:text-white dark:shadow-primary/30 dark:focus:ring-primary/40"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Enhanced Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant={timerWarning ? "danger" : "primary"}
                      size="sm"
                      disabled={isSubmitting || !cardContent.trim() || (isAdmin && !timerActive) || (timerActive && remainingSeconds === 0)}
                      loading={isSubmitting}
                      icon={Send}
                      className={`relative z-10 !h-9 transition-all duration-200 ${
                        isAdmin && !timerActive
                          ? "!bg-gray-400 !border-gray-400 cursor-not-allowed shadow-none"
                          : timerActive && remainingSeconds === 0
                          ? "!bg-gray-400 !border-gray-400 cursor-not-allowed shadow-none"
                          : timerWarning
                          ? "!border-orange-600 !bg-gradient-to-r !from-orange-600 !to-orange-500 hover:!from-orange-700 hover:!to-orange-600 !shadow-lg !shadow-orange-500/50 hover:!shadow-xl hover:!shadow-orange-600/60 hover:scale-105 active:scale-95"
                          : "!bg-gradient-to-r !from-primary !to-primary/90 hover:!from-primary/90 hover:!to-primary !shadow-lg !shadow-primary/50 hover:!shadow-xl hover:!shadow-primary/60 hover:scale-105 active:scale-95"
                      }`}
                    >
                      {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          <p className={`mt-1.5 text-[10px] ${
            isAdmin && !timerActive
              ? "text-gray-600 dark:text-gray-400 font-medium"
              : timerActive && remainingSeconds === 0
              ? "text-red-600 dark:text-red-400 font-medium"
              : timerWarning
              ? "text-orange-600 dark:text-orange-400 font-medium"
              : "text-gray-500 dark:text-gray-400"
          }`}>
            {isAdmin && !timerActive
              ? "Admin: Lütfen önce süreyi başlatın!"
              : timerActive && remainingSeconds === 0
              ? "Süre doldu! Artık kart eklenemez."
              : timerWarning
              ? "Son 10 saniye! Hızlıca gönderin!"
              : "İpucu: Göndermek için Cmd/Ctrl + Enter tuşlarına basın"}
          </p>
        </form>
      )}

      {/* Timer Start Modal */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-300 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Süre Başlat
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Kart gönderme süresini seçin
            </p>
            
            {/* Timer Seçenekleri - Kartlar */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {timerOptions.map((option) => {
                const isSelected = selectedDuration === option.minutes;
                return (
                  <Button
                    key={option.minutes}
                    type="button"
                    onClick={() => setSelectedDuration(option.minutes)}
                    variant={isSelected ? "primary" : "outline"}
                    size="lg"
                    className={`!p-4 !flex-col !h-auto transition-all ${
                      isSelected
                        ? "!border-blue-600 !bg-blue-50 !text-blue-700 !shadow-sm dark:!border-blue-500 dark:!bg-blue-950/30 dark:!text-blue-400"
                        : "!border-gray-200 !bg-white !text-gray-700 hover:!border-gray-300 hover:!bg-gray-50 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!border-gray-600 dark:hover:!bg-gray-750"
                    }`}
                  >
                    <span className="text-base font-semibold">{option.label}</span>
                    <span className={`mt-1 text-xs ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {option.seconds} saniye
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowTimerModal(false);
                  setSelectedDuration(null);
                }}
                variant="ghost"
                size="md"
              >
                İptal
              </Button>
              <Button
                onClick={handleStartTimer}
                disabled={selectedDuration === null}
                variant="primary"
                size="md"
              >
                Başlat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs & Cards Section - Only show if active session */}
      {activeSession && activeSession.is_active && (
        <>
      {/* Category Tabs */}
      <div className="flex gap-1.5 rounded-md border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-900">
        {(["mad", "sad", "glad"] as RetroCategory[]).map((category) => {
          const info = getCategoryInfo(category);
          const isSelected = viewCategory === category;
          const getColor = () => {
            if (info.color === "red") {
              return { 
                border: "var(--destructive)", 
                bg: "oklch(0.98 0.01 25)",
                hover: "oklch(0.96 0.02 25)",
                text: "var(--destructive)"
              };
            }
            if (info.color === "blue") {
              return { 
                border: "var(--primary)", 
                bg: "oklch(0.98 0.01 250)",
                hover: "oklch(0.96 0.02 250)",
                text: "var(--primary)"
              };
            }
            return { 
              border: "oklch(0.6 0.2 145)", 
              bg: "oklch(0.98 0.01 145)",
              hover: "oklch(0.96 0.02 145)",
              text: "oklch(0.6 0.2 145)"
            };
          };
          const color = getColor();
          const categoryCount = cards.filter((c) => c.category === category).length;

          return (
            <Button
              key={category}
              type="button"
              onClick={() => setViewCategory(category)}
              variant={isSelected ? "primary" : "ghost"}
              size="sm"
              icon={info.icon}
              iconPosition="left"
              className={`flex-1 transition-all duration-200 ${
                isSelected 
                  ? "" 
                  : "!text-gray-700 hover:!bg-gray-50 dark:!text-gray-300 dark:hover:!bg-gray-800"
              }`}
              style={isSelected ? {
                borderColor: color.border,
                backgroundColor: color.bg,
                color: color.text,
              } : {}}
            >
              {info.title}
              {categoryCount > 0 && (
                <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                  isSelected 
                    ? "bg-white/50" 
                    : "bg-gray-200 dark:bg-gray-700"
                }`}>
                  {categoryCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Cards Section */}
      <div>
        {/* Section Header */}
        <div className="mb-3 flex items-center gap-2">
          {(() => {
            const info = getCategoryInfo(viewCategory);
            const getColor = () => {
              if (info.color === "red") return { border: "var(--destructive)", bg: "oklch(0.97 0.02 25)" };
              if (info.color === "blue") return { border: "var(--primary)", bg: "oklch(0.97 0.02 250)" };
              return { border: "oklch(0.6 0.2 145)", bg: "oklch(0.97 0.02 145)" };
            };
            const color = getColor();
            return (
              <div
                className="flex h-6 w-6 items-center justify-center rounded border transition-colors"
                style={{
                  borderColor: color.border,
                  backgroundColor: color.bg,
                }}
              >
                <info.icon
                  className="h-3.5 w-3.5 transition-colors"
                  style={{ color: color.border }}
                />
              </div>
            );
          })()}
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {getCategoryInfo(viewCategory).title} Kartları
          </h2>
          {categoryCards.length > 0 && (
            <span className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              {categoryCards.length}
            </span>
          )}
        </div>

        {/* Cards Grid */}
        {categoryCards.length === 0 ? (
          <EmptyState
            icon={getCategoryInfo(viewCategory).icon}
            title="Henüz kart yok"
            description={cardsRevealed
              ? "Kartlar açıldı, yeni kart eklenemez."
              : "Yukarıdaki formu kullanarak ilk kartı ekleyebilirsiniz."}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((card) => {
            const isOwnCard = card.user_key === userKey;
            const canViewContent = card.is_revealed || isOwnCard;
            const categoryInfo = getCategoryInfo(card.category);
            
            const getCardColor = () => {
              if (categoryInfo.color === "red") return { border: "var(--destructive)", bg: "oklch(0.95 0.05 25)" };
              if (categoryInfo.color === "blue") return { border: "var(--primary)", bg: "oklch(0.95 0.05 250)" };
              return { border: "oklch(0.6 0.2 145)", bg: "oklch(0.95 0.05 145)" };
            };
            const cardColor = getCardColor();

            return (
              <div
                key={card.id}
                className="group relative flex flex-col overflow-hidden rounded-md border border-gray-300 bg-white p-3 transition-all hover:border-gray-400 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderColor: cardColor.border,
                }}
              >
                {/* Top Color Bar */}
                <div
                  className="absolute left-0 top-0 h-0.5 w-full"
                  style={{ backgroundColor: cardColor.border }}
                />

                {/* Header - Category & Time */}
                <div className="relative mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded border"
                      style={{
                        borderColor: cardColor.border,
                        backgroundColor: cardColor.bg,
                      }}
                    >
                      <categoryInfo.icon
                        className="h-3 w-3"
                        style={{ color: cardColor.border }}
                      />
                    </div>
                    <span
                      className="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        borderColor: cardColor.border,
                        backgroundColor: cardColor.bg,
                        color: cardColor.border,
                      }}
                    >
                      {categoryInfo.title}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400">
                    {new Date(card.created_at).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* User Avatar & Name */}
                <div className="relative mb-2 flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-[10px] font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {card.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {card.user_name}
                  </span>
                </div>

                {/* Card Content */}
                {canViewContent ? (
                  <div className="relative mb-3 flex-1 min-h-[50px]">
                    <p className="text-xs leading-relaxed text-gray-800 dark:text-gray-200 line-clamp-4">
                      {card.content}
                    </p>
                  </div>
                ) : (
                  <div className="relative mb-3 rounded border border-dashed border-gray-300 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800/50">
                    <Lock className="mx-auto mb-1.5 h-4 w-4 text-gray-400 opacity-50 dark:text-gray-500" />
                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      Kart Gizli
                    </p>
                    <p className="mt-0.5 text-[9px] text-gray-500 dark:text-gray-500">
                      Admin açana kadar bekleyin
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="relative mt-auto flex items-center gap-1.5 border-t pt-2 opacity-0 transition-opacity group-hover:opacity-100" style={{ borderTopColor: `${cardColor.border}30` }}>
                  {isOwnCard && !cardsRevealed && (
                    <>
                      <Button
                        onClick={() => handleOpenEdit(card)}
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        className="!h-6 !w-6 !p-0 !min-h-0"
                        style={{
                          borderColor: `${cardColor.border}80`,
                          color: cardColor.border,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = cardColor.border;
                          e.currentTarget.style.backgroundColor = `${cardColor.border}20`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${cardColor.border}80`;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Düzenle"
                      />
                      <Button
                        onClick={() => handleDeleteCard(card)}
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        className="!h-6 !w-6 !p-0 !min-h-0 !border-red-400 !text-red-400 hover:!bg-red-400/10 dark:!border-red-500 dark:!text-red-500"
                        title="Sil"
                      />
                    </>
                  )}
                  {isAdmin && cardsRevealed && (
                    <Button
                      onClick={() => {
                        setSelectedCardForAction(card.id);
                        setShowAddActionModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      className="!h-6 !w-6 !p-0 !min-h-0"
                      style={{
                        borderColor: `${cardColor.border}80`,
                        color: cardColor.border,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = cardColor.border;
                        e.currentTarget.style.backgroundColor = `${cardColor.border}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${cardColor.border}80`;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Aksiyon Ekle"
                    />
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
        </>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <RetroCardModal
          open={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSubmit={(category, content) =>
            handleEditCard(editingCard.id, content)
          }
          initialCategory={editingCard.category}
          initialContent={editingCard.content}
          isEdit
        />
      )}

      {/* Action Items Section */}
      <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
        <RetroActionItems
          roomId={roomId}
          userKey={userKey}
          username={username}
          isAdmin={isAdmin}
          cardsRevealed={cardsRevealed}
          cards={cards}
          hasActiveSession={activeSession?.is_active ?? false}
        />
      </div>

      {/* Add Action Modal from Card */}
      <RetroActionItemModal
        open={showAddActionModal}
        onClose={() => {
          setShowAddActionModal(false);
          setSelectedCardForAction(null);
        }}
        onSubmit={async (data: RetroActionItemInput) => {
          if (!isAdmin) {
            showToast("Sadece admin aksiyon maddesi ekleyebilir.", "error");
            return;
          }
          if (!cardsRevealed) {
            showToast("Önce kartları açmanız gerekiyor!", "error");
            return;
          }

          try {
            const supabase = getSupabase();
            const { error } = await supabase.from("retro_action_items").insert({
              room_id: roomId,
              content: data.content.trim(),
              created_by_key: userKey,
              created_by_username: username,
              is_completed: false,
              position: 0,
              flag: data.flag || null,
              custom_flag: data.custom_flag || null,
              retro_card_id: data.retro_card_id || selectedCardForAction || null,
            });

            if (error) throw error;
            setShowAddActionModal(false);
            setSelectedCardForAction(null);
            // Başarı mesajı gereksiz - kullanıcı aksiyon maddesini zaten görüyor
          } catch (err) {
            showToast("Aksiyon maddesi eklenirken bir hata oluştu.", "error");
          }
        }}
        initialCardId={selectedCardForAction}
        customFlags={customFlags.map((cf) => ({
          id: cf.id,
          flag_name: cf.flag_name,
          flag_color: cf.flag_color,
        }))}
        onAddCustomFlag={async (flagName) => {
          await addCustomFlag(flagName);
        }}
        cards={cards.map((c) => ({
          id: c.id,
          content: c.content,
          category: c.category,
        }))}
      />
    </div>
  );
});

export default RetroRoomView;

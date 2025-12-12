"use client";

import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Timer, Layers, Angry, Frown, Smile, PartyPopper, Lightbulb, Lock, Clock, XCircle, CheckCircle2, Send } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useRetroCards } from "@/hooks/useRetroCards";
import { useRetroTimer } from "@/hooks/useRetroTimer";
import { useToastContext } from "@/contexts/ToastContext";
import type { RetroCategory, RetroCard } from "@/interfaces/Retro.interface";
import RetroCardModal from "./RetroCardModal";
import RetroActionItems from "./RetroActionItems";

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
  const { cards, loading } = useRetroCards(roomId);
  const { showToast } = useToastContext();
  const {
    remainingSeconds,
    isActive: timerActive,
    isWarning: timerWarning,
    startTimer,
    stopTimer,
  } = useRetroTimer(roomId, isAdmin);
  const [activeTab, setActiveTab] = useState<RetroCategory>("glad");
  const [editingCard, setEditingCard] = useState<RetroCard | null>(null);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [cardContent, setCardContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [warningShown, setWarningShown] = useState<boolean>(false);
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
    () => cards.filter((card) => card.category === activeTab),
    [cards, activeTab]
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

      // Admin için timer başlatmadan kart göndermeyi engelle
      if (isAdmin && !timerActive) {
        showToast("⏱️ Lütfen önce timer'ı başlatın!", "error");
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
        const supabase = getSupabase();
        const { error } = await supabase.from("retro_cards").insert({
          room_id: roomId,
          user_key: userKey,
          user_name: username,
          category,
          content: content.trim(),
          is_revealed: false,
        });

        if (error) throw error;
        setCardContent("");
        textareaRef.current?.focus();
        showToast("Kart başarıyla eklendi!", "success");
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
    showToast(`${option.label} timer başlatıldı!`, "success");
  }, [startTimer, selectedDuration, showToast, timerOptions]);

  const handleSubmitCard = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await handleAddCard(activeTab, cardContent);
    },
    [activeTab, cardContent, handleAddCard]
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
        showToast("Kart başarıyla güncellendi!", "success");
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
        showToast("Kart başarıyla silindi!", "success");
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
      showToast("Tüm kartlar açıldı!", "success");
    } catch (err) {
      showToast("Kartlar açılırken bir hata oluştu.", "error");
    } finally {
      setIsRevealing(false);
    }
  }, [roomId, isAdmin, showToast]);

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="border-b-2 border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {(["mad", "sad", "glad"] as RetroCategory[]).map((category) => {
            const info = getCategoryInfo(category);
            const isActive = activeTab === category;
            const categoryCount = cards.filter((c) => c.category === category).length;
            
            // Aktif tab için stil
            const activeStyles =
              info.color === "red"
                ? "border-b-2 border-red-600 text-red-600 dark:text-red-400"
                : info.color === "blue"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-b-2 border-green-600 text-green-600 dark:text-green-400";

            // Pasif tab için stil
            const inactiveStyles = "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600";

            return (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
                  isActive ? activeStyles : inactiveStyles
                }`}
              >
                <info.icon className="h-5 w-5" />
                <span>{info.title}</span>
                {categoryCount > 0 && (
                  <span className={`ml-1 rounded-md border-2 px-2 py-0.5 text-xs font-bold shadow-sm ${
                    isActive 
                      ? info.color === "red"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : info.color === "blue"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {categoryCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timer Display */}
      {timerActive && (
        <div className={`rounded-md border-2 p-5 shadow-sm ${
          timerWarning
            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
            : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className={`text-lg font-bold ${
                  timerWarning
                    ? "text-red-700 dark:text-red-300"
                    : "text-blue-700 dark:text-blue-300"
                }`}>
                  {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, "0")}
                </p>
                <p className={`text-xs font-medium ${
                  timerWarning
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}>
                  {timerWarning ? "Son 10 saniye!" : "Kart gönderme süresi"}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={stopTimer}
                className="rounded-md border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-red-700 hover:bg-red-700 hover:shadow-md"
              >
                Durdur
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status and Reveal Button */}
      {cardsRevealed ? (
        <div className="rounded-md border-2 border-green-300 bg-green-50 p-5 shadow-sm dark:border-green-800 dark:bg-green-950/30">
          <div className="flex items-center justify-center gap-3">
            <PartyPopper className="h-6 w-6 text-green-600 dark:text-green-400" />
            <p className="font-semibold text-green-700 dark:text-green-300">
              Tüm kartlar açıldı! Yeni kart eklenemez.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border-2 border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {revealedCards.length}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {" "}
                    açık
                  </span>
                  <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {hiddenCards.length}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {" "}
                    gizli
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && !timerActive && (
                <button
                  onClick={() => setShowTimerModal(true)}
                  className="rounded-md border-2 border-purple-600 bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-purple-700 hover:bg-purple-700 hover:shadow-md dark:border-purple-500 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700"
                >
                  <Timer className="mr-1.5 h-4 w-4" />
                  Timer Başlat
                </button>
              )}
              {isAdmin && hiddenCards.length > 0 && (
                <button
                  onClick={handleRevealAll}
                  disabled={isRevealing}
                  className="rounded-md border-2 border-green-600 bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-green-700 hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:hover:shadow-sm dark:border-green-500 dark:bg-green-600 dark:text-white dark:hover:bg-green-700"
                >
                  {isRevealing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Açılıyor...
                    </span>
                  ) : (
                    <>
                      <Layers className="mr-1.5 h-4 w-4" />
                      Tümünü Aç
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Card Form */}
      {!cardsRevealed && (
        <form
          onSubmit={handleSubmitCard}
          className={`rounded-md border-2 p-4 shadow-sm ${
            isAdmin && !timerActive
              ? "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30"
              : timerActive && remainingSeconds === 0
              ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
              : timerWarning
              ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* Category Selector */}
            <div className="flex gap-2">
              {(["mad", "sad", "glad"] as RetroCategory[]).map((category) => {
                const info = getCategoryInfo(category);
                const isActive = activeTab === category;
                const activeColor =
                  info.color === "red"
                    ? "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400"
                    : info.color === "blue"
                    ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400"
                    : "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400";

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveTab(category)}
                    className={`flex items-center gap-1.5 rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? activeColor
                        : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    <info.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{info.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Text Input */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={cardContent}
                onChange={(e) => setCardContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${getCategoryInfo(activeTab).title} kategorisine kart ekle...`}
                className={`w-full resize-none rounded-md border-2 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  isAdmin && !timerActive
                    ? "border-yellow-300 bg-yellow-50 text-gray-500 cursor-not-allowed dark:border-yellow-800 dark:bg-yellow-950/30"
                    : timerActive && remainingSeconds === 0
                    ? "border-red-300 bg-red-50 text-gray-500 cursor-not-allowed dark:border-red-800 dark:bg-red-950/30"
                    : timerWarning
                    ? "border-orange-300 bg-orange-50 text-gray-900 focus:border-orange-500 focus:ring-orange-500/20 dark:border-orange-700 dark:bg-orange-950/30 dark:text-white"
                    : "border-gray-300 bg-gray-50 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-400"
                }`}
                rows={2}
                disabled={isSubmitting || (isAdmin && !timerActive) || (timerActive && remainingSeconds === 0)}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !cardContent.trim() || (isAdmin && !timerActive) || (timerActive && remainingSeconds === 0)}
              className={`flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold text-white shadow-md transition-all ${
                isAdmin && !timerActive
                  ? "bg-yellow-500 cursor-not-allowed"
                  : timerActive && remainingSeconds === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : timerWarning
                  ? "border-2 border-orange-600 bg-orange-600 hover:border-orange-700 hover:bg-orange-700 hover:shadow-md"
                  : "border-2 border-indigo-600 bg-indigo-600 hover:border-indigo-700 hover:bg-indigo-700 hover:shadow-md"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Gönder</span>
                </>
              )}
            </button>
          </div>
          <p className={`mt-2 text-xs ${
            isAdmin && !timerActive
              ? "text-yellow-600 dark:text-yellow-400 font-semibold"
              : timerActive && remainingSeconds === 0
              ? "text-red-600 dark:text-red-400 font-semibold"
              : timerWarning
              ? "text-orange-600 dark:text-orange-400 font-semibold"
              : "text-gray-500 dark:text-gray-400"
          }`}>
            {isAdmin && !timerActive
              ? "Admin: Lütfen önce timer'ı başlatın!"
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
          <div className="w-full max-w-2xl rounded-md border-2 border-gray-200 bg-white p-6 shadow-md dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Timer Başlat
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Kart gönderme süresini seçin
            </p>
            
            {/* Timer Seçenekleri - Kartlar */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {timerOptions.map((option) => {
                const isSelected = selectedDuration === option.minutes;
                return (
                  <button
                    key={option.minutes}
                    type="button"
                    onClick={() => setSelectedDuration(option.minutes)}
                    className={`rounded-md border-2 p-4 text-center transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-50 shadow-sm dark:bg-purple-950/30 dark:border-purple-400"
                        : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600 dark:hover:bg-purple-950/20"
                    }`}
                  >
                    <div className={`text-2xl font-bold ${
                      isSelected
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {option.label}
                    </div>
                    <div className={`mt-1 text-xs ${
                      isSelected
                        ? "text-purple-500 dark:text-purple-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {option.seconds} saniye
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTimerModal(false);
                  setSelectedDuration(null);
                }}
                className="flex-1 rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleStartTimer}
                disabled={selectedDuration === null}
                className="flex-1 rounded-md border-2 border-purple-600 bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-purple-700 hover:bg-purple-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-purple-500 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700"
              >
                Başlat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-3">
        {categoryCards.length === 0 ? (
          <div className="rounded-md border-2 border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            {(() => {
              const CategoryIcon = getCategoryInfo(activeTab).icon;
              return <CategoryIcon className="mx-auto mb-2 h-12 w-12 text-gray-400 dark:text-gray-500" />;
            })()}
            <p className="font-medium text-gray-900 dark:text-white">
              Henüz kart yok
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {cardsRevealed
                ? "Kartlar açıldı, yeni kart eklenemez."
                : "Yukarıdaki formu kullanarak ilk kartı ekleyebilirsiniz."}
            </p>
          </div>
        ) : (
          categoryCards.map((card) => {
            const isOwnCard = card.user_key === userKey;
            const canViewContent = card.is_revealed || isOwnCard;
            const categoryInfo = getCategoryInfo(card.category);
            
            // Kategoriye göre renkler - Sharp design system
            const cardStyles =
              categoryInfo.color === "red"
                ? {
                    borderLeft: "border-l-red-600 dark:border-l-red-500",
                    accent: "text-red-600 dark:text-red-400",
                    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  }
                : categoryInfo.color === "blue"
                ? {
                    borderLeft: "border-l-blue-600 dark:border-l-blue-500",
                    accent: "text-blue-600 dark:text-blue-400",
                    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  }
                : {
                    borderLeft: "border-l-green-600 dark:border-l-green-500",
                    accent: "text-green-600 dark:text-green-400",
                    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  };

            return (
              <div
                key={card.id}
                className={`group relative border-l-4 ${cardStyles.borderLeft} border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900`}
              >
                {/* Kategori Badge */}
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border-2 px-2 py-0.5 text-xs font-semibold shadow-sm ${cardStyles.badge}`}
                  >
                    <categoryInfo.icon className="h-3.5 w-3.5" />
                    <span>{categoryInfo.title}</span>
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {new Date(card.created_at).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Kullanıcı Adı */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-200 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {card.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {card.user_name}
                  </span>
                </div>

                {/* Kart İçeriği */}
                {canViewContent ? (
                  <div className="mb-3">
                    <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                      {card.content}
                    </p>
                  </div>
                ) : (
                  <div className="mb-3 border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
                    <Lock className="mx-auto mb-2 h-8 w-8 text-gray-400 opacity-50 dark:text-gray-500" />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Kart Gizli
                    </p>
                    <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-500">
                      Admin açana kadar bekleyin
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {isOwnCard && !cardsRevealed && (
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleOpenEdit(card)}
                      className="flex-1 rounded-md border-2 border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:border-blue-700 hover:bg-blue-700 hover:shadow-md active:border-blue-800 active:bg-blue-800 dark:border-blue-500 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
                    >
                      ✎ Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card)}
                      className="flex-1 rounded-md border-2 border-red-600 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:border-red-700 hover:bg-red-700 hover:shadow-md active:border-red-800 active:bg-red-800 dark:border-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>


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
      <div className="mt-8 border-t-2 border-gray-200 pt-6 dark:border-gray-800">
        <RetroActionItems
          roomId={roomId}
          userKey={userKey}
          username={username}
          isAdmin={isAdmin}
          cardsRevealed={cardsRevealed}
        />
      </div>
    </div>
  );
});

export default RetroRoomView;

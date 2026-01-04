"use client";

import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Timer, Layers, Angry, Frown, Smile, PartyPopper, Lock, Send } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useRetroCards } from "@/hooks/useRetroCards";
import { useRetroTimer } from "@/hooks/useRetroTimer";
import { useToastContext } from "@/contexts/ToastContext";
import type { RetroCategory, RetroCard } from "@/interfaces/Retro.interface";
import RetroCardModal from "./RetroCardModal";
import RetroActionItems from "./RetroActionItems";
import Button from "@/components/ui/Button";

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

  const timerOptions = useMemo(() => [
    { label: "15 Saniye", seconds: 15, minutes: 0.25 },
    { label: "1 Dakika", seconds: 60, minutes: 1 },
    { label: "3 Dakika", seconds: 180, minutes: 3 },
    { label: "5 Dakika", seconds: 300, minutes: 5 },
    { label: "10 Dakika", seconds: 600, minutes: 10 },
  ], []);

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
      } catch {
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
      } catch {
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
      } catch {
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
    } catch {
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
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="border-b-2 border-border">
        <div className="flex gap-1">
          {(["mad", "sad", "glad"] as RetroCategory[]).map((category) => {
            const info = getCategoryInfo(category);
            const isActive = activeTab === category;
            const categoryCount = cards.filter((c) => c.category === category).length;
            
            // Aktif tab için stil
            const activeStyles =
              info.color === "red"
                ? "border-b-2 border-destructive text-destructive"
                : info.color === "blue"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-success text-success";

            // Pasif tab için stil
            const inactiveStyles = "text-muted-foreground hover:text-card-foreground hover:border-b-2 hover:border-border";

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
                        ? "bg-destructive/10 text-destructive border-destructive/50"
                        : info.color === "blue"
                        ? "bg-primary/10 text-primary border-primary/50"
                        : "bg-success/10 text-success border-success/50"
                      : "bg-muted text-muted-foreground border-border"
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
        <div className={`group relative overflow-hidden rounded-lg border-l-4 ${
          timerWarning
            ? "border-l-red-600 dark:border-l-red-500"
            : "border-l-primary dark:border-l-primary"
        } border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5`}>
          {/* Glow Effect */}
          <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br blur-xl transition-all group-hover:scale-150 ${
            timerWarning
              ? "from-red-500/10 to-red-500/5"
              : "from-primary/10 to-primary/5"
          }`} />
          
          {/* Content */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-transparent transition-transform group-hover:scale-110">
                <Timer className={`h-6 w-6 ${
                  timerWarning
                    ? "text-red-600 dark:text-red-400"
                    : "text-primary"
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  timerWarning
                    ? "text-red-600 dark:text-red-400"
                    : "text-primary"
                }`}>
                  {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, "0")}
                </p>
                <p className={`text-xs font-medium ${
                  timerWarning
                    ? "text-red-600 dark:text-red-400"
                    : "text-primary"
                }`}>
                  {timerWarning ? "Son 10 saniye!" : "Kart gönderme süresi"}
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button
                onClick={stopTimer}
                variant="danger"
                size="sm"
              >
                Durdur
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status and Reveal Button */}
      {cardsRevealed ? (
        <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-green-600 dark:border-l-green-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5">
          {/* Glow Effect */}
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/5 blur-xl transition-all group-hover:scale-150" />
          
          {/* Content */}
          <div className="relative z-10 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-transparent transition-transform group-hover:scale-110">
              <PartyPopper className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-semibold text-green-600 dark:text-green-400">
              Tüm kartlar açıldı! Yeni kart eklenemez.
            </p>
          </div>
        </div>
      ) : (
        <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-primary dark:border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5">
          {/* Glow Effect */}
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
          
          {/* Content */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-transparent transition-transform group-hover:scale-110">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div className="text-sm">
                <span className="text-lg font-bold text-card-foreground">
                  {revealedCards.length}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  açık
                </span>
                <span className="mx-2 text-muted-foreground opacity-50">•</span>
                <span className="text-lg font-bold text-card-foreground">
                  {hiddenCards.length}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  gizli
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && !timerActive && (
                <Button
                  onClick={() => setShowTimerModal(true)}
                  variant="primary"
                  size="sm"
                  icon={Timer}
                >
                  Timer Başlat
                </Button>
              )}
              {isAdmin && hiddenCards.length > 0 && (
                <Button
                  onClick={handleRevealAll}
                  disabled={isRevealing}
                  variant="primary"
                  size="sm"
                  icon={Layers}
                  loading={isRevealing}
                  className="border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700"
                >
                  Tümünü Aç
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Card Form */}
      {!cardsRevealed && (
        <form
          onSubmit={handleSubmitCard}
          className={`group relative overflow-hidden rounded-lg border-l-4 ${
            isAdmin && !timerActive
              ? "border-l-yellow-600 dark:border-l-yellow-500"
              : timerActive && remainingSeconds === 0
              ? "border-l-red-600 dark:border-l-red-500"
              : timerWarning
              ? "border-l-yellow-600 dark:border-l-yellow-500"
              : "border-l-primary dark:border-l-primary"
          } border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 sm:p-5`}
        >
          {/* Glow Effect */}
          <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br blur-xl transition-all group-hover:scale-150 ${
            isAdmin && !timerActive
              ? "from-yellow-500/10 to-yellow-500/5"
              : timerActive && remainingSeconds === 0
              ? "from-red-500/10 to-red-500/5"
              : timerWarning
              ? "from-yellow-500/10 to-yellow-500/5"
              : "from-primary/10 to-primary/5"
          }`} />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {/* Category Selector */}
              <div className="flex gap-2">
                {(["mad", "sad", "glad"] as RetroCategory[]).map((category) => {
                  const info = getCategoryInfo(category);
                  const isActive = activeTab === category;
                  const activeColor =
                    info.color === "red"
                      ? "bg-destructive/10 border-destructive text-destructive"
                      : info.color === "blue"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-success/10 border-success text-success";

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveTab(category)}
                      className={`flex items-center gap-1.5 rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                        isActive
                          ? activeColor
                          : "border-border bg-muted text-muted-foreground hover:bg-accent"
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
                  className={`w-full resize-none rounded-md border-2 px-4 py-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 ${
                    isAdmin && !timerActive
                      ? "border-warning/50 bg-warning/10 text-muted-foreground cursor-not-allowed"
                      : timerActive && remainingSeconds === 0
                      ? "border-destructive/50 bg-destructive/10 text-muted-foreground cursor-not-allowed"
                      : timerWarning
                      ? "border-warning/50 bg-warning/10 text-foreground focus:border-warning focus:ring-warning/20"
                      : "border-input bg-input text-foreground focus:border-primary focus:ring-primary/20"
                  }`}
                  rows={2}
                  disabled={isSubmitting || (isAdmin && !timerActive) || (timerActive && remainingSeconds === 0)}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !cardContent.trim() || (isAdmin && !timerActive) || (timerActive && remainingSeconds === 0)}
                variant={timerWarning ? "primary" : "primary"}
                size="md"
                icon={Send}
                loading={isSubmitting}
                className={timerWarning ? "border-orange-600 bg-orange-600 text-white hover:border-orange-700 hover:bg-orange-700" : ""}
              >
                Gönder
              </Button>
            </div>
            <p className={`relative mt-2 text-xs ${
              isAdmin && !timerActive
                ? "text-warning font-semibold"
                : timerActive && remainingSeconds === 0
                ? "text-destructive font-semibold"
                : timerWarning
                ? "text-warning font-semibold"
                : "text-muted-foreground"
            }`}>
              {isAdmin && !timerActive
                ? "Admin: Lütfen önce timer'ı başlatın!"
                : timerActive && remainingSeconds === 0
                ? "Süre doldu! Artık kart eklenemez."
                : timerWarning
                ? "Son 10 saniye! Hızlıca gönderin!"
                : "İpucu: Göndermek için Cmd/Ctrl + Enter tuşlarına basın"}
            </p>
          </div>
        </form>
      )}

      {/* Timer Start Modal */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="group relative w-full max-w-2xl overflow-hidden rounded-lg border-l-4 border-l-primary dark:border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-6 shadow-xl">
            {/* Glow Effect */}
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
            
            {/* Content */}
            <div className="relative z-10">
              <h3 className="mb-4 text-xl font-bold text-card-foreground">
                Timer Başlat
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
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
                      className={`group/option relative overflow-hidden rounded-lg border-l-4 ${
                        isSelected
                          ? "border-l-primary dark:border-l-primary"
                          : "border-l-border"
                      } border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 text-center shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-md ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className={`text-2xl font-bold ${
                        isSelected
                          ? "text-primary"
                          : "text-card-foreground"
                      }`}>
                        {option.label}
                      </div>
                      <div className={`mt-1 text-xs ${
                        isSelected
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}>
                        {option.seconds} saniye
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowTimerModal(false);
                    setSelectedDuration(null);
                  }}
                  variant="secondary"
                  size="md"
                  fullWidth
                >
                  İptal
                </Button>
                <Button
                  onClick={handleStartTimer}
                  disabled={selectedDuration === null}
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  Başlat
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-3">
        {categoryCards.length === 0 ? (
          <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-primary dark:border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-8 text-center shadow-md">
            {/* Glow Effect */}
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
            
            {/* Content */}
            <div className="relative z-10">
              {(() => {
                const CategoryIcon = getCategoryInfo(activeTab).icon;
                return (
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-transparent">
                      <CategoryIcon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                );
              })()}
              <p className="font-medium text-card-foreground">
                Henüz kart yok
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {cardsRevealed
                  ? "Kartlar açıldı, yeni kart eklenemez."
                  : "Yukarıdaki formu kullanarak ilk kartı ekleyebilirsiniz."}
              </p>
            </div>
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
                    borderLeft: "border-l-destructive",
                    accent: "text-destructive",
                    badge: "bg-destructive/10 text-destructive border-destructive/50",
                  }
                : categoryInfo.color === "blue"
                ? {
                    borderLeft: "border-l-primary",
                    accent: "text-primary",
                    badge: "bg-primary/10 text-primary border-primary/50",
                  }
                : {
                    borderLeft: "border-l-success",
                    accent: "text-success",
                    badge: "bg-success/10 text-success border-success/50",
                  };

            // Glow effect color
            const glowColor =
              categoryInfo.color === "red"
                ? "from-red-500/10 to-red-500/5"
                : categoryInfo.color === "blue"
                ? "from-primary/10 to-primary/5"
                : "from-green-500/10 to-green-500/5";

            return (
              <div
                key={card.id}
                className={`group relative overflow-hidden rounded-lg border-l-4 ${cardStyles.borderLeft} border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-4`}
              >
                {/* Glow Effect */}
                <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${glowColor} blur-xl transition-all group-hover:scale-150`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Kategori Badge */}
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border-2 px-2 py-0.5 text-xs font-semibold shadow-sm ${cardStyles.badge}`}
                    >
                      <categoryInfo.icon className="h-3.5 w-3.5" />
                      <span>{categoryInfo.title}</span>
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {new Date(card.created_at).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Kullanıcı Adı */}
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-muted text-xs font-bold text-muted-foreground">
                      {card.user_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-card-foreground">
                      {card.user_name}
                    </span>
                  </div>

                  {/* Kart İçeriği */}
                  {canViewContent ? (
                    <div className="mb-3">
                      <p className="text-sm leading-relaxed text-foreground">
                        {card.content}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 rounded-md border-2 border-dashed border-border bg-muted/50 p-4 text-center">
                      <Lock className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Kart Gizli
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Admin açana kadar bekleyin
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isOwnCard && !cardsRevealed && (
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        onClick={() => handleOpenEdit(card)}
                        variant="primary"
                        size="sm"
                        fullWidth
                      >
                        ✎ Düzenle
                      </Button>
                      <Button
                        onClick={() => handleDeleteCard(card)}
                        variant="danger"
                        size="sm"
                        fullWidth
                      >
                        🗑️ Sil
                      </Button>
                    </div>
                  )}
                </div>
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
      <div className="mt-8 border-t-2 border-border pt-6">
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

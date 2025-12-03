"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRetroCards } from "@/hooks/useRetroCards";
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
      return { title: "Mad 😠", color: "red", emoji: "😠" };
    case "sad":
      return { title: "Sad 😢", color: "blue", emoji: "😢" };
    case "glad":
      return { title: "Glad 😊", color: "green", emoji: "😊" };
  }
};

const RetroRoomView = memo(function RetroRoomView({
  roomId,
  userKey,
  username,
  isAdmin,
}: RetroRoomViewProps) {
  const { cards, loading } = useRetroCards(roomId);
  const [activeTab, setActiveTab] = useState<RetroCategory>("glad");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCard, setEditingCard] = useState<RetroCard | null>(null);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);

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

  const handleAddCard = useCallback(
    async (category: RetroCategory, content: string) => {
      if (cardsRevealed) {
        alert("❌ Kartlar açıldıktan sonra yeni kart eklenemez!");
        return;
      }

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
        setShowAddModal(false);
      } catch (err) {
        // Kart ekleme hatası
        alert("Kart eklenirken bir hata oluştu.");
      }
    },
    [roomId, userKey, username, cardsRevealed]
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
      } catch (err) {
        // Kart güncelleme hatası
        alert("Kart güncellenirken bir hata oluştu.");
      }
    },
    []
  );

  const handleDeleteCard = useCallback(
    async (card: RetroCard) => {
      if (card.user_key !== userKey) {
        alert("Sadece kendi kartlarınızı silebilirsiniz.");
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
      } catch (err) {
        // Kart silme hatası
        alert("Kart silinirken bir hata oluştu.");
      }
    },
    [userKey]
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
      alert("🎉 Tüm kartlar açıldı!");
    } catch (err) {
      // Kart açma hatası
      alert("Kartlar açılırken bir hata oluştu.");
    } finally {
      setIsRevealing(false);
    }
  }, [roomId, isAdmin]);

  const handleOpenEdit = useCallback(
    (card: RetroCard) => {
      if (card.user_key !== userKey) {
        alert("Sadece kendi kartlarınızı düzenleyebilirsiniz.");
        return;
      }
      setEditingCard(card);
    },
    [userKey]
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
      <div className="flex gap-3 overflow-x-auto pb-2">
        {(["mad", "sad", "glad"] as RetroCategory[]).map((category) => {
          const info = getCategoryInfo(category);
          const isActive = activeTab === category;
          const activeGradient =
            info.color === "red"
              ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30"
              : info.color === "blue"
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
              : "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30";
          return (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`rounded-xl px-6 py-3 font-semibold transition-all ${
                isActive
                  ? `${activeGradient} scale-105`
                  : "bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <span className="mr-2 text-lg">{info.emoji}</span>
              {info.title.split(" ")[0]}
              {isActive && (
                <span className="ml-2 text-xs opacity-80">
                  ({categoryCards.length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status and Reveal Button */}
      {cardsRevealed ? (
        <div className="rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-5 shadow-sm dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/30">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">🎉</span>
            <p className="font-semibold text-green-700 dark:text-green-300">
              Tüm kartlar açıldı! Yeni kart eklenemez.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
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
            {isAdmin && hiddenCards.length > 0 && (
              <button
                onClick={handleRevealAll}
                disabled={isRevealing}
                className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-green-700 hover:to-emerald-700 hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-md active:scale-95"
              >
                {isRevealing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Açılıyor...
                  </span>
                ) : (
                  "🎴 Tümünü Aç"
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-3">
        {categoryCards.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-4xl">{getCategoryInfo(activeTab).emoji}</p>
            <p className="font-medium text-gray-900 dark:text-white">
              Henüz kart yok
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bu kategoriye ilk kartı eklemek için aşağıdaki butonu
              kullanabilirsiniz.
            </p>
          </div>
        ) : (
          categoryCards.map((card) => {
            const isOwnCard = card.user_key === userKey;
            const canViewContent = card.is_revealed || isOwnCard;
            const categoryInfo = getCategoryInfo(card.category);
            
            // Kategoriye göre gradient ve renkler
            const cardStyles =
              categoryInfo.color === "red"
                ? {
                    gradient: "from-red-50 via-red-50/50 to-white dark:from-red-950/30 dark:via-red-900/20 dark:to-gray-900",
                    border: "border-red-200 dark:border-red-800/50",
                    accent: "text-red-600 dark:text-red-400",
                    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                  }
                : categoryInfo.color === "blue"
                ? {
                    gradient: "from-blue-50 via-blue-50/50 to-white dark:from-blue-950/30 dark:via-blue-900/20 dark:to-gray-900",
                    border: "border-blue-200 dark:border-blue-800/50",
                    accent: "text-blue-600 dark:text-blue-400",
                    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                  }
                : {
                    gradient: "from-green-50 via-green-50/50 to-white dark:from-green-950/30 dark:via-green-900/20 dark:to-gray-900",
                    border: "border-green-200 dark:border-green-800/50",
                    accent: "text-green-600 dark:text-green-400",
                    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
                  };

            return (
              <div
                key={card.id}
                className={`group relative overflow-hidden rounded-xl border-2 ${cardStyles.border} bg-gradient-to-br ${cardStyles.gradient} p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:shadow-gray-900/20`}
              >
                {/* Kategori Badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cardStyles.badge}`}
                  >
                    <span className="text-base">{categoryInfo.emoji}</span>
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
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-xs font-bold text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300">
                    {card.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {card.user_name}
                  </span>
                </div>

                {/* Kart İçeriği */}
                {canViewContent ? (
                  <div className="mb-4">
                    <p className="leading-relaxed text-gray-800 dark:text-gray-200">
                      {card.content}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="mb-2 text-4xl opacity-50">🔒</div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Kart Gizli
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Admin açana kadar bekleyin
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {isOwnCard && (
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleOpenEdit(card)}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                    >
                      ✎ Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card)}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-95"
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

      {/* Add Card FAB */}
      {!cardsRevealed && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-8 right-8 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl font-bold text-white shadow-xl shadow-indigo-500/50 transition-all hover:scale-110 hover:shadow-2xl hover:shadow-indigo-500/60 active:scale-95 dark:from-indigo-500 dark:to-purple-500"
          title="Yeni Kart Ekle"
        >
          <span className="drop-shadow-lg">+</span>
        </button>
      )}

      {/* Add Card Modal */}
      <RetroCardModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(category, content) => handleAddCard(category, content)}
        initialCategory={activeTab}
      />

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
      <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
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

"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRetroCards } from "@/hooks/useRetroCards";
import type { RetroCategory, RetroCard } from "@/interfaces/Retro.interface";
import RetroCardModal from "./RetroCardModal";

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
        console.error("Kart ekleme hatası:", err);
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
        console.error("Kart güncelleme hatası:", err);
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
        console.error("Kart silme hatası:", err);
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
      console.error("Kart açma hatası:", err);
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
      <div className="flex gap-2 overflow-x-auto">
        {(["mad", "sad", "glad"] as RetroCategory[]).map((category) => {
          const info = getCategoryInfo(category);
          const isActive = activeTab === category;
          const activeClass =
            info.color === "red"
              ? "bg-red-600 text-white"
              : info.color === "blue"
              ? "bg-blue-600 text-white"
              : "bg-green-600 text-white";
          return (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`rounded-lg px-4 py-2 font-semibold transition ${
                isActive
                  ? activeClass
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {info.emoji} {info.title.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Status and Reveal Button */}
      {cardsRevealed ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-center font-semibold text-green-700 dark:text-green-300">
            🎉 Tüm kartlar açıldı! Yeni kart eklenemez.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📊 {revealedCards.length} kart açık, {hiddenCards.length} kart
              gizli
            </p>
            {isAdmin && hiddenCards.length > 0 && (
              <button
                onClick={handleRevealAll}
                disabled={isRevealing}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isRevealing ? "Açılıyor..." : "Tümünü Aç"}
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
            const borderColor =
              categoryInfo.color === "red"
                ? "border-red-300 dark:border-red-700"
                : categoryInfo.color === "blue"
                ? "border-blue-300 dark:border-blue-700"
                : "border-green-300 dark:border-green-700";

            return (
              <div
                key={card.id}
                className={`rounded-lg border-l-4 ${borderColor} bg-white p-4 shadow-sm dark:bg-gray-900`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {card.user_name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(card.created_at).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {canViewContent ? (
                  <p className="mb-3 text-gray-700 dark:text-gray-300">
                    {card.content}
                  </p>
                ) : (
                  <div className="mb-3 rounded bg-gray-100 p-3 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Kart gizli - Admin açana kadar bekleyin
                  </div>
                )}

                {isOwnCard && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(card)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Sil
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
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-gray-900 text-2xl font-bold text-white shadow-lg transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          +
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
    </div>
  );
});

export default RetroRoomView;

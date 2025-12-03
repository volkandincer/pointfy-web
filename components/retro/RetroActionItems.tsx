"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRetroActionItems } from "@/hooks/useRetroActionItems";
import { useRoomCustomFlags } from "@/hooks/useRoomCustomFlags";
import type {
  RetroActionItem,
  RetroActionItemInput,
} from "@/interfaces/RetroActionItem.interface";
import RetroActionItemModal from "./RetroActionItemModal";

interface RetroActionItemsProps {
  roomId: string;
  userKey: string;
  username: string;
  isAdmin: boolean;
  cardsRevealed: boolean;
}

const RetroActionItems = memo(function RetroActionItems({
  roomId,
  userKey,
  username,
  isAdmin,
  cardsRevealed,
}: RetroActionItemsProps) {
  const { actionItems, loading } = useRetroActionItems(roomId);
  const { customFlags, addCustomFlag } = useRoomCustomFlags(roomId, isAdmin);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RetroActionItem | null>(null);

  const PREDEFINED_FLAGS: Record<string, { emoji: string; label: string; color: string }> = {
    "high-priority": { emoji: "🔴", label: "Yüksek Öncelik", color: "#EF4444" },
    "medium-priority": { emoji: "🟡", label: "Orta Öncelik", color: "#F59E0B" },
    "low-priority": { emoji: "🟢", label: "Düşük Öncelik", color: "#10B981" },
    improvement: { emoji: "🔵", label: "İyileştirme", color: "#3B82F6" },
    research: { emoji: "🟣", label: "Araştırma", color: "#8B5CF6" },
    general: { emoji: "⚪", label: "Genel", color: "#6B7280" },
  };

  const completedItems = useMemo(
    () => actionItems.filter((item) => item.is_completed),
    [actionItems]
  );

  const pendingItems = useMemo(
    () => actionItems.filter((item) => !item.is_completed),
    [actionItems]
  );

  const handleAddItem = useCallback(
    async (data: RetroActionItemInput) => {
      if (!isAdmin) {
        alert("Sadece admin aksiyon maddesi ekleyebilir.");
        return;
      }
      if (!cardsRevealed) {
        alert("❌ Önce kartları açmanız gerekiyor!");
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
          position: actionItems.length,
          flag: data.flag || null,
          custom_flag: data.custom_flag || null,
        });

        if (error) throw error;
        setShowAddModal(false);
      } catch (err) {
        alert("Aksiyon maddesi eklenirken bir hata oluştu.");
      }
    },
    [roomId, userKey, username, isAdmin, actionItems.length, cardsRevealed]
  );

  const handleEditItem = useCallback(
    async (itemId: string, data: RetroActionItemInput) => {
      if (!isAdmin) {
        alert("Sadece admin aksiyon maddelerini düzenleyebilir.");
        return;
      }

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("retro_action_items")
          .update({
            content: data.content.trim(),
            flag: data.flag || null,
            custom_flag: data.custom_flag || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);

        if (error) throw error;
        setEditingItem(null);
      } catch (err) {
        alert("Aksiyon maddesi güncellenirken bir hata oluştu.");
      }
    },
    [isAdmin]
  );

  const handleDeleteItem = useCallback(
    async (item: RetroActionItem) => {
      if (!isAdmin) {
        alert("Sadece admin aksiyon maddelerini silebilir.");
        return;
      }

      if (!confirm("Bu aksiyon maddesini silmek istediğinizden emin misiniz?"))
        return;

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("retro_action_items")
          .delete()
          .eq("id", item.id);

        if (error) throw error;
      } catch (err) {
        alert("Aksiyon maddesi silinirken bir hata oluştu.");
      }
    },
    [isAdmin]
  );

  const handleToggleComplete = useCallback(
    async (item: RetroActionItem) => {
      if (!isAdmin) {
        alert("Sadece admin aksiyon maddelerini tamamlayabilir.");
        return;
      }

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("retro_action_items")
          .update({
            is_completed: !item.is_completed,
            completed_at: !item.is_completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) throw error;
      } catch (err) {
        alert("Aksiyon maddesi güncellenirken bir hata oluştu.");
      }
    },
    [isAdmin]
  );

  const handleOpenEdit = useCallback(
    (item: RetroActionItem) => {
      if (!isAdmin) {
        alert("Sadece admin aksiyon maddelerini düzenleyebilir.");
        return;
      }
      setEditingItem(item);
    },
    [isAdmin]
  );

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  // Kartlar açılmadıysa aksiyon maddelerini gösterme
  if (!cardsRevealed) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-2 text-4xl">📋</p>
        <p className="font-medium text-gray-900 dark:text-white">
          Aksiyon Maddeleri
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Kartlar açıldıktan sonra aksiyon maddeleri eklenebilir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 print-section">
      {/* Print Header - Only visible when printing */}
      <div className="print-header mb-6 hidden">
        <h1 className="text-2xl font-bold text-gray-900">Aksiyon Maddeleri</h1>
        <p className="mt-2 text-sm text-gray-600">
          Tarih: {new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📋 Aksiyon Maddeleri
        </h3>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => window.print()}
                className="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                title="Yazdır/PDF"
              >
                🖨️ Yazdır
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                + Ekle
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bekleyen ({pendingItems.length})
          </h4>
          {pendingItems.map((item) => {
            const flagInfo = item.flag
              ? PREDEFINED_FLAGS[item.flag]
              : item.custom_flag
              ? customFlags.find((cf) => cf.id === item.custom_flag)
              : null;

            const flagColor =
              flagInfo && "color" in flagInfo
                ? flagInfo.color
                : flagInfo && "flag_color" in flagInfo
                ? flagInfo.flag_color
                : "#6B7280";
            const flagLabel =
              flagInfo && "label" in flagInfo
                ? flagInfo.label
                : flagInfo && "flag_name" in flagInfo
                ? flagInfo.flag_name
                : "";
            const flagEmoji = flagInfo && "emoji" in flagInfo ? flagInfo.emoji : "";

            return (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {flagInfo && (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: `${flagColor}20`,
                            color: flagColor,
                          }}
                        >
                          {flagEmoji} {flagLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-white">{item.content}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.created_by_username} •{" "}
                      {new Date(item.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                        title="Tamamla"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        title="Düzenle"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        title="Sil"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tamamlanan ({completedItems.length})
          </h4>
          {completedItems.map((item) => {
            const flagInfo = item.flag
              ? PREDEFINED_FLAGS[item.flag]
              : item.custom_flag
              ? customFlags.find((cf) => cf.id === item.custom_flag)
              : null;

            const flagColor =
              flagInfo && "color" in flagInfo
                ? flagInfo.color
                : flagInfo && "flag_color" in flagInfo
                ? flagInfo.flag_color
                : "#6B7280";
            const flagLabel =
              flagInfo && "label" in flagInfo
                ? flagInfo.label
                : flagInfo && "flag_name" in flagInfo
                ? flagInfo.flag_name
                : "";
            const flagEmoji = flagInfo && "emoji" in flagInfo ? flagInfo.emoji : "";

            return (
              <div
                key={item.id}
                className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/20"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {flagInfo && (
                      <div className="mb-2">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: `${flagColor}20`,
                            color: flagColor,
                          }}
                        >
                          {flagEmoji} {flagLabel}
                        </span>
                      </div>
                    )}
                    <p className="line-through text-gray-600 dark:text-gray-400">
                      {item.content}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.created_by_username} •{" "}
                      {item.completed_at &&
                        new Date(item.completed_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className="rounded-md bg-gray-600 px-2 py-1 text-xs font-semibold text-white hover:bg-gray-700"
                        title="Geri Al"
                      >
                        ↺
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        title="Düzenle"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        title="Sil"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {actionItems.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-2 text-4xl">📋</p>
          <p className="font-medium text-gray-900 dark:text-white">
            Henüz aksiyon maddesi yok
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "İlk aksiyon maddesini eklemek için yukarıdaki butonu kullanabilirsiniz."
              : "Admin aksiyon maddesi eklediğinde burada görünecek."}
          </p>
        </div>
      )}

      {/* Add Modal */}
      <RetroActionItemModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => handleAddItem(data)}
        customFlags={customFlags.map((cf) => ({
          id: cf.id,
          flag_name: cf.flag_name,
          flag_color: cf.flag_color,
        }))}
        onAddCustomFlag={async (flagName) => {
          await addCustomFlag(flagName);
        }}
      />

      {/* Edit Modal */}
      {editingItem && (
        <RetroActionItemModal
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={(data) => handleEditItem(editingItem.id, data)}
          initialContent={editingItem.content}
          initialFlag={editingItem.flag}
          initialCustomFlag={editingItem.custom_flag}
          isEdit
          customFlags={customFlags.map((cf) => ({
            id: cf.id,
            flag_name: cf.flag_name,
            flag_color: cf.flag_color,
          }))}
          onAddCustomFlag={async (flagName) => {
            await addCustomFlag(flagName);
          }}
        />
      )}
    </div>
  );
});

export default RetroActionItems;


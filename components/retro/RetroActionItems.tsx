"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { ClipboardList, User, Clock, CheckCircle2, Edit, Trash2, RotateCcw, Printer, Plus, Circle, AlertCircle, Lightbulb, Search, HelpCircle } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useRetroActionItems } from "@/hooks/useRetroActionItems";
import { useRoomCustomFlags } from "@/hooks/useRoomCustomFlags";
import { useToastContext } from "@/contexts/ToastContext";
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
  const { showToast } = useToastContext();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RetroActionItem | null>(null);

  const PREDEFINED_FLAGS: Record<string, { icon: typeof Circle; label: string; color: string }> = {
    "high-priority": { icon: Circle, label: "Yüksek Öncelik", color: "#EF4444" },
    "medium-priority": { icon: AlertCircle, label: "Orta Öncelik", color: "#F59E0B" },
    "low-priority": { icon: CheckCircle2, label: "Düşük Öncelik", color: "#10B981" },
    improvement: { icon: Lightbulb, label: "İyileştirme", color: "#3B82F6" },
    research: { icon: Search, label: "Araştırma", color: "#8B5CF6" },
    general: { icon: HelpCircle, label: "Genel", color: "#6B7280" },
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
          position: actionItems.length,
          flag: data.flag || null,
          custom_flag: data.custom_flag || null,
        });

        if (error) throw error;
        setShowAddModal(false);
        showToast("Aksiyon maddesi başarıyla eklendi!", "success");
      } catch (err) {
        showToast("Aksiyon maddesi eklenirken bir hata oluştu.", "error");
      }
    },
    [roomId, userKey, username, isAdmin, actionItems.length, cardsRevealed, showToast]
  );

  const handleEditItem = useCallback(
    async (itemId: string, data: RetroActionItemInput) => {
      if (!isAdmin) {
        showToast("Sadece admin aksiyon maddelerini düzenleyebilir.", "error");
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
        showToast("Aksiyon maddesi başarıyla güncellendi!", "success");
      } catch (err) {
        showToast("Aksiyon maddesi güncellenirken bir hata oluştu.", "error");
      }
    },
    [isAdmin, showToast]
  );

  const handleDeleteItem = useCallback(
    async (item: RetroActionItem) => {
      if (!isAdmin) {
        showToast("Sadece admin aksiyon maddelerini silebilir.", "error");
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
        showToast("Aksiyon maddesi başarıyla silindi!", "success");
      } catch (err) {
        showToast("Aksiyon maddesi silinirken bir hata oluştu.", "error");
      }
    },
    [isAdmin, showToast]
  );

  const handleToggleComplete = useCallback(
    async (item: RetroActionItem) => {
      if (!isAdmin) {
        showToast("Sadece admin aksiyon maddelerini tamamlayabilir.", "error");
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
        showToast(
          item.is_completed
            ? "Aksiyon maddesi beklemeye alındı!"
            : "Aksiyon maddesi tamamlandı!",
          "success"
        );
      } catch (err) {
        showToast("Aksiyon maddesi güncellenirken bir hata oluştu.", "error");
      }
    },
    [isAdmin, showToast]
  );

  const handleOpenEdit = useCallback(
    (item: RetroActionItem) => {
      if (!isAdmin) {
        showToast("Sadece admin aksiyon maddelerini düzenleyebilir.", "error");
        return;
      }
      setEditingItem(item);
    },
    [isAdmin, showToast]
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
      <div className="rounded-md border-2 border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="font-medium text-gray-900 dark:text-white">
          Aksiyon Maddeleri
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
      <div className="flex flex-col gap-4 no-print sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">
            <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Aksiyon Maddeleri
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pendingItems.length} bekleyen, {completedItems.length} tamamlanan
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Yazdır/PDF"
            >
              <Printer className="h-4 w-4" />
              Yazdır
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 border-2 border-indigo-600 bg-indigo-600 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-indigo-700 hover:border-indigo-700"
            >
              <Plus className="h-5 w-5" />
              Yeni Aksiyon Maddesi Ekle
            </button>
          </div>
        )}
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 border-2 border-orange-600 bg-orange-500"></div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Bekleyen Aksiyonlar ({pendingItems.length})
            </h4>
          </div>
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
            const FlagIcon = flagInfo && "icon" in flagInfo ? flagInfo.icon : null;

            return (
              <div
                key={item.id}
                className="group relative rounded-md border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-4 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: '#f97316',
                }}
              >
                {/* Flag Badge */}
                {flagInfo && (
                  <div className="mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border-2 px-3 py-1 text-xs font-bold shadow-sm"
                      style={{
                        backgroundColor: `${flagColor}15`,
                        color: flagColor,
                        borderColor: flagColor,
                      }}
                    >
                      {FlagIcon && <FlagIcon className="h-3.5 w-3.5" />}
                      {flagLabel}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="mb-4">
                  <p className="text-[15px] leading-7 font-medium text-gray-900 dark:text-white">
                    {item.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t-2 border-gray-200 pt-4 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.created_by_username}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {new Date(item.created_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isAdmin && (
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className="flex items-center gap-1.5 border-2 border-green-600 bg-green-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700 hover:border-green-700"
                        title="Tamamla"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Tamamla
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1.5 border-2 border-blue-600 bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 hover:border-blue-700"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="flex items-center gap-1.5 border-2 border-red-600 bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 hover:border-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                        Sil
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 border-2 border-green-600 bg-green-500"></div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Tamamlanan Aksiyonlar ({completedItems.length})
            </h4>
          </div>
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
            const FlagIcon = flagInfo && "icon" in flagInfo ? flagInfo.icon : null;

            return (
              <div
                key={item.id}
                className="group relative rounded-md border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-4 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: '#16a34a',
                }}
              >
                {/* Completed Badge */}
                <div className="absolute right-4 top-4">
                  <div className="flex h-8 w-8 items-center justify-center border-2 border-green-600 bg-green-600 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>

                {/* Flag Badge */}
                {flagInfo && (
                  <div className="mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border-2 px-3 py-1 text-xs font-bold shadow-sm opacity-75"
                      style={{
                        backgroundColor: `${flagColor}15`,
                        color: flagColor,
                        borderColor: flagColor,
                      }}
                    >
                      {FlagIcon && <FlagIcon className="h-3.5 w-3.5" />}
                      {flagLabel}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="mb-4 pr-12">
                  <p className="text-[15px] leading-7 font-medium text-gray-600 line-through dark:text-gray-400">
                    {item.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t-2 border-green-200 pt-4 dark:border-green-800/50">
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.created_by_username}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.completed_at &&
                          new Date(item.completed_at).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isAdmin && (
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className="flex items-center gap-1.5 border-2 border-gray-600 bg-gray-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-700 hover:border-gray-700"
                        title="Geri Al"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Geri Al
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1.5 border-2 border-blue-600 bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 hover:border-blue-700"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="flex items-center gap-1.5 border-2 border-red-600 bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 hover:border-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                        Sil
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
        <div className="rounded-md border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30">
              <ClipboardList className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
            Henüz aksiyon maddesi yok
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "İlk aksiyon maddesini ekleyerek başlayın."
              : "Admin aksiyon maddesi eklediğinde burada görünecek."}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mx-auto flex items-center gap-3 border-2 border-indigo-600 bg-indigo-600 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-indigo-700 hover:border-indigo-700"
            >
              <Plus className="h-6 w-6" />
              İlk Aksiyon Maddesini Ekle
            </button>
          )}
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


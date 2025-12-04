"use client";

import { memo, useState, useCallback, useMemo } from "react";
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
        showToast("Sadece admin aksiyon maddesi ekleyebilir.", "error");
        return;
      }
      if (!cardsRevealed) {
        showToast("❌ Önce kartları açmanız gerekiyor!", "error");
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
        showToast("✅ Aksiyon maddesi başarıyla eklendi!", "success");
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
        showToast("✅ Aksiyon maddesi başarıyla güncellendi!", "success");
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
        showToast("✅ Aksiyon maddesi başarıyla silindi!", "success");
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
            ? "✅ Aksiyon maddesi beklemeye alındı!"
            : "✅ Aksiyon maddesi tamamlandı!",
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
      <div className="flex flex-col gap-4 no-print sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl shadow-md">
            📋
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
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Yazdır/PDF"
            >
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Yazdır
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-indigo-500/50 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/60 hover:scale-105 active:scale-95"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Yeni Aksiyon Maddesi Ekle
            </button>
          </div>
        )}
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-orange-500"></div>
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
            const flagEmoji = flagInfo && "emoji" in flagInfo ? flagInfo.emoji : "";

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border-2 border-l-4 border-l-orange-500 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm transition-all hover:border-l-orange-600 hover:shadow-md hover:-translate-y-0.5 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800/50"
              >
                {/* Flag Badge */}
                {flagInfo && (
                  <div className="mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm"
                      style={{
                        backgroundColor: `${flagColor}15`,
                        color: flagColor,
                        border: `1px solid ${flagColor}40`,
                      }}
                    >
                      <span className="text-sm">{flagEmoji}</span>
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
                <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.created_by_username}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
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
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-green-700 active:scale-95"
                        title="Tamamla"
                      >
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Tamamla
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95"
                        title="Düzenle"
                      >
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
                        title="Sil"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
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
            <div className="h-1 w-1 rounded-full bg-green-500"></div>
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
            const flagEmoji = flagInfo && "emoji" in flagInfo ? flagInfo.emoji : "";

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border-2 border-l-4 border-l-green-500 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50/50 to-white p-5 shadow-sm transition-all hover:border-l-green-600 hover:shadow-md hover:-translate-y-0.5 dark:border-green-800 dark:from-green-950/30 dark:via-emerald-950/20 dark:to-gray-900"
              >
                {/* Completed Badge */}
                <div className="absolute right-4 top-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                    <svg
                      className="h-5 w-5"
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
                  </div>
                </div>

                {/* Flag Badge */}
                {flagInfo && (
                  <div className="mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm opacity-75"
                      style={{
                        backgroundColor: `${flagColor}15`,
                        color: flagColor,
                        border: `1px solid ${flagColor}40`,
                      }}
                    >
                      <span className="text-sm">{flagEmoji}</span>
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
                <div className="flex items-center justify-between border-t border-green-200 pt-4 dark:border-green-800/50">
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.created_by_username}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
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
                        className="flex items-center gap-1.5 rounded-lg bg-gray-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-700 active:scale-95"
                        title="Geri Al"
                      >
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Geri Al
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95"
                        title="Düzenle"
                      >
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
                        title="Sil"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
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
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-12 text-center dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-3xl dark:from-indigo-900/30 dark:to-purple-900/30">
              📋
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
              className="mx-auto flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/50 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl hover:shadow-indigo-500/60 hover:scale-105 active:scale-95"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
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


"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { ClipboardList, User, Clock, CheckCircle2, Edit, Trash2, RotateCcw, Printer, Plus, Circle, AlertCircle, Lightbulb, Search, HelpCircle, FileText } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useRetroActionItems } from "@/hooks/useRetroActionItems";
import { useRoomCustomFlags } from "@/hooks/useRoomCustomFlags";
import { useToastContext } from "@/contexts/ToastContext";
import EmptyState from "@/components/jira/EmptyState";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type {
  RetroActionItem,
  RetroActionItemInput,
} from "@/interfaces/RetroActionItem.interface";
import type { RetroCard } from "@/interfaces/Retro.interface";
import RetroActionItemModal from "./RetroActionItemModal";

interface RetroActionItemsProps {
  roomId: string;
  userKey: string;
  username: string;
  isAdmin: boolean;
  cardsRevealed: boolean;
  cards?: RetroCard[];
}

const RetroActionItems = memo(function RetroActionItems({
  roomId,
  userKey,
  username,
  isAdmin,
  cardsRevealed,
  cards = [],
}: RetroActionItemsProps) {
  const { actionItems, loading } = useRetroActionItems(roomId);
  const { customFlags, addCustomFlag } = useRoomCustomFlags(roomId, isAdmin);
  const { showToast } = useToastContext();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RetroActionItem | null>(null);
  const [viewingItem, setViewingItem] = useState<RetroActionItem | null>(null);

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
          retro_card_id: data.retro_card_id || null,
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
            retro_card_id: data.retro_card_id || null,
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
        <h1 className="text-base font-bold text-gray-900">Aksiyon Maddeleri</h1>
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
      <div className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-3 no-print sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">
              <ClipboardList className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Aksiyon Maddeleri
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {pendingItems.length} bekleyen, {completedItems.length} tamamlanan
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-1.5">
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
                icon={Printer}
                className="!h-7 !px-2.5 !text-xs"
                title="Yazdır/PDF"
              >
                Yazdır
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="primary"
                size="sm"
                icon={Plus}
                className="!h-7 !px-2.5 !text-xs"
              >
                Yeni Ekle
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-orange-500"></div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Bekleyen ({pendingItems.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                onClick={() => setViewingItem(item)}
                className="group relative cursor-pointer rounded-md border border-gray-300 bg-white p-3 transition-all hover:border-gray-400 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: '#f97316',
                  borderLeftWidth: '3px',
                }}
              >
                {/* Flag Badge */}
                {flagInfo && (
                  <div className="mb-2">
                    <span
                      className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${flagColor}15`,
                        color: flagColor,
                        borderColor: flagColor,
                      }}
                    >
                      {FlagIcon && <FlagIcon className="h-2.5 w-2.5" />}
                      {flagLabel}
                    </span>
                  </div>
                )}

                {/* Card Info */}
                {item.retro_card_id && (() => {
                  const card = cards.find((c) => c.id === item.retro_card_id);
                  if (!card) return null;
                  const getCategoryInfo = (category: string) => {
                    if (category === "mad") return { title: "Mad", color: "var(--destructive)" };
                    if (category === "sad") return { title: "Sad", color: "var(--primary)" };
                    return { title: "Glad", color: "oklch(0.6 0.2 145)" };
                  };
                  const categoryInfo = getCategoryInfo(card.category);
                  return (
                    <div className="mb-2 flex items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium" style={{ borderColor: categoryInfo.color, color: categoryInfo.color, backgroundColor: `${categoryInfo.color}15` }}>
                        <FileText className="h-2.5 w-2.5" />
                        <span>{categoryInfo.title}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Content */}
                <div className="mb-2 min-h-[40px]">
                  <p className="text-xs leading-relaxed text-gray-900 dark:text-white line-clamp-3">
                    {item.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {item.created_by_username}
                    </span>
                    <span className="text-gray-400">•</span>
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(item.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => handleToggleComplete(item)}
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        className="!h-6 !w-6 !p-0 !min-h-0 !border-green-600 !bg-green-600 hover:!border-green-700 hover:!bg-green-700 dark:!border-green-500 dark:!bg-green-600 dark:hover:!border-green-400 dark:hover:!bg-green-500"
                        title="Tamamla"
                      />
                      <Button
                        onClick={() => handleOpenEdit(item)}
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        className="!h-6 !w-6 !p-0 !min-h-0"
                        title="Düzenle"
                      />
                      <Button
                        onClick={() => handleDeleteItem(item)}
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        className="!h-6 !w-6 !p-0 !min-h-0 !border-red-400 !text-red-400 hover:!bg-red-400/10 dark:!border-red-500 dark:!text-red-500"
                        title="Sil"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-green-500"></div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Tamamlanan ({completedItems.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                onClick={() => setViewingItem(item)}
                className="group relative cursor-pointer rounded-md border border-gray-300 bg-white p-3 transition-all hover:border-gray-400 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 opacity-75"
                style={{
                  borderLeftColor: '#16a34a',
                  borderLeftWidth: '3px',
                }}
              >
                {/* Completed Badge */}
                <div className="absolute right-2 top-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded border border-green-600 bg-green-600 text-white">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                </div>

                {/* Flag Badge */}
                {flagInfo && (
                  <div className="mb-2">
                    <span
                      className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold opacity-75"
                      style={{
                        backgroundColor: `${flagColor}15`,
                        color: flagColor,
                        borderColor: flagColor,
                      }}
                    >
                      {FlagIcon && <FlagIcon className="h-2.5 w-2.5" />}
                      {flagLabel}
                    </span>
                  </div>
                )}

                {/* Card Info */}
                {item.retro_card_id && (() => {
                  const card = cards.find((c) => c.id === item.retro_card_id);
                  if (!card) return null;
                  const getCategoryInfo = (category: string) => {
                    if (category === "mad") return { title: "Mad", color: "var(--destructive)" };
                    if (category === "sad") return { title: "Sad", color: "var(--primary)" };
                    return { title: "Glad", color: "oklch(0.6 0.2 145)" };
                  };
                  const categoryInfo = getCategoryInfo(card.category);
                  return (
                    <div className="mb-2 flex items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium opacity-75" style={{ borderColor: categoryInfo.color, color: categoryInfo.color, backgroundColor: `${categoryInfo.color}15` }}>
                        <FileText className="h-2.5 w-2.5" />
                        <span>{categoryInfo.title}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Content */}
                <div className="mb-2 min-h-[40px] pr-6">
                  <p className="text-xs leading-relaxed text-gray-600 line-through dark:text-gray-400 line-clamp-3">
                    {item.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-green-200 pt-2 dark:border-green-800/50">
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {item.created_by_username}
                    </span>
                    <span className="text-gray-400">•</span>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>
                      {item.completed_at &&
                        new Date(item.completed_at).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                        })}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                      <Button
                        onClick={() => handleToggleComplete(item)}
                        variant="outline"
                        size="sm"
                        icon={RotateCcw}
                        className="!h-6 !w-6 !p-0 !min-h-0"
                        title="Geri Al"
                      />
                      <Button
                        onClick={() => handleOpenEdit(item)}
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        className="!h-6 !w-6 !p-0 !min-h-0"
                        title="Düzenle"
                      />
                      <Button
                        onClick={() => handleDeleteItem(item)}
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        className="!h-6 !w-6 !p-0 !min-h-0 !border-red-400 !text-red-400 hover:!bg-red-400/10 dark:!border-red-500 dark:!text-red-500"
                        title="Sil"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {actionItems.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Henüz aksiyon maddesi yok"
          description={
            isAdmin
              ? "İlk aksiyon maddesini ekleyerek başlayın."
              : "Admin aksiyon maddesi eklediğinde burada görünecek."
          }
          actionLabel={isAdmin ? "İlk Aksiyon Maddesini Ekle" : undefined}
          onAction={isAdmin ? () => setShowAddModal(true) : undefined}
        />
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
        cards={cards.map((c) => ({
          id: c.id,
          content: c.content,
          category: c.category,
        }))}
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
          initialCardId={editingItem.retro_card_id}
          isEdit
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
      )}

      {/* View Detail Modal */}
      {viewingItem && (() => {
        const item = viewingItem;
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
        const card = item.retro_card_id ? cards.find((c) => c.id === item.retro_card_id) : null;
        const getCategoryInfo = (category: string) => {
          if (category === "mad") return { title: "Mad", color: "var(--destructive)" };
          if (category === "sad") return { title: "Sad", color: "var(--primary)" };
          return { title: "Glad", color: "oklch(0.6 0.2 145)" };
        };
        const categoryInfo = card ? getCategoryInfo(card.category) : null;

        return (
          <Modal
            open={!!viewingItem}
            onClose={() => setViewingItem(null)}
            title="Aksiyon Detayı"
          >
            <div className="space-y-4">
              {/* Flag Badge */}
              {flagInfo && (
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold"
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

              {/* Card Info */}
              {card && categoryInfo && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium" style={{ borderColor: categoryInfo.color, color: categoryInfo.color, backgroundColor: `${categoryInfo.color}15` }}>
                      <FileText className="h-3 w-3" />
                      <span>{categoryInfo.title} Kartı</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{card.content}</p>
                </div>
              )}

              {/* Content */}
              <div className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className={`text-sm leading-relaxed ${item.is_completed ? 'text-gray-600 line-through dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {item.content}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Oluşturan:</span>
                  <span className="text-gray-900 dark:text-white">{item.created_by_username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Oluşturulma:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(item.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {item.is_completed && item.completed_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tamamlanma:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(item.completed_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isAdmin && (
                <div className="flex gap-2">
                  {!item.is_completed ? (
                    <Button
                      onClick={() => {
                        handleToggleComplete(item);
                        setViewingItem(null);
                      }}
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      className="!border-green-600 !bg-green-600 hover:!border-green-700 hover:!bg-green-700 dark:!border-green-500 dark:!bg-green-600 dark:hover:!border-green-400 dark:hover:!bg-green-500"
                    >
                      Tamamla
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        handleToggleComplete(item);
                        setViewingItem(null);
                      }}
                      variant="outline"
                      size="sm"
                      icon={RotateCcw}
                    >
                      Geri Al
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setViewingItem(null);
                      handleOpenEdit(item);
                    }}
                    variant="outline"
                    size="sm"
                    icon={Edit}
                  >
                    Düzenle
                  </Button>
                  <Button
                    onClick={() => {
                      handleDeleteItem(item);
                      setViewingItem(null);
                    }}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                  >
                    Sil
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
});

export default RetroActionItems;


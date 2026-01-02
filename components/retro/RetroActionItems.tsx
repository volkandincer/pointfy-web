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
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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
      } catch {
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
      } catch {
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
      } catch {
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
      } catch {
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
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  // Kartlar açılmadıysa aksiyon maddelerini gösterme
  if (!cardsRevealed) {
    return (
      <Card className="p-8 text-center">
        <ClipboardList className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
        <p className="font-medium text-card-foreground">
          Aksiyon Maddeleri
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Kartlar açıldıktan sonra aksiyon maddeleri eklenebilir.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 print-section">
      {/* Print Header - Only visible when printing */}
      <div className="print-header mb-6 hidden">
        <h1 className="text-2xl font-bold text-card-foreground">Aksiyon Maddeleri</h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
          <div className="flex h-10 w-10 items-center justify-center border-2 border-primary bg-primary/10">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-card-foreground">
              Aksiyon Maddeleri
            </h3>
            <p className="text-xs text-muted-foreground">
              {pendingItems.length} bekleyen, {completedItems.length} tamamlanan
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => window.print()}
              variant="secondary"
              size="md"
              icon={Printer}
              title="Yazdır/PDF"
            >
              Yazdır
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="primary"
              size="lg"
              icon={Plus}
            >
              Yeni Aksiyon Maddesi Ekle
            </Button>
          </div>
        )}
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 border-2 border-warning bg-warning"></div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
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
              <Card
                key={item.id}
                className="group relative border-l-4 border-t-2 border-r-2 border-b-2 border-warning p-3 shadow-sm transition-all active:border-accent active:shadow-md sm:p-4 hover:border-accent hover:shadow-md"
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
                  <p className="text-[15px] leading-7 font-medium text-card-foreground">
                    {item.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t-2 border-border pt-4">
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold text-card-foreground">
                        {item.created_by_username}
                      </span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-muted-foreground">
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
                      <Button
                        onClick={() => handleToggleComplete(item)}
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        title="Tamamla"
                        className="border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700"
                      >
                        Tamamla
                      </Button>
                      <Button
                        onClick={() => handleOpenEdit(item)}
                        variant="primary"
                        size="sm"
                        icon={Edit}
                        title="Düzenle"
                      >
                        Düzenle
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item)}
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        title="Sil"
                      >
                        Sil
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 border-2 border-success bg-success"></div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
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
              <Card
                key={item.id}
                className="group relative border-l-4 border-t-2 border-r-2 border-b-2 border-success p-3 shadow-sm transition-all active:border-accent active:shadow-md sm:p-4 hover:border-accent hover:shadow-md"
              >
                {/* Completed Badge */}
                <div className="absolute right-4 top-4">
                  <div className="flex h-8 w-8 items-center justify-center border-2 border-success bg-success text-success-foreground">
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
                  <p className="text-[15px] leading-7 font-medium text-muted-foreground line-through">
                    {item.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t-2 border-success/50 pt-4">
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold text-card-foreground">
                        {item.created_by_username}
                      </span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-muted-foreground">
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
                      <Button
                        onClick={() => handleToggleComplete(item)}
                        variant="secondary"
                        size="sm"
                        icon={RotateCcw}
                        title="Geri Al"
                      >
                        Geri Al
                      </Button>
                      <Button
                        onClick={() => handleOpenEdit(item)}
                        variant="primary"
                        size="sm"
                        icon={Edit}
                        title="Düzenle"
                      >
                        Düzenle
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item)}
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        title="Sil"
                      >
                        Sil
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {actionItems.length === 0 && (
        <Card className="border-dashed p-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center border-2 border-primary bg-primary/10">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold text-card-foreground">
            Henüz aksiyon maddesi yok
          </h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {isAdmin
              ? "İlk aksiyon maddesini ekleyerek başlayın."
              : "Admin aksiyon maddesi eklediğinde burada görünecek."}
          </p>
          {isAdmin && (
            <Button
              onClick={() => setShowAddModal(true)}
              variant="primary"
              size="lg"
              icon={Plus}
            >
              İlk Aksiyon Maddesini Ekle
            </Button>
          )}
        </Card>
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


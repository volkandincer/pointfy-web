"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { Circle, AlertCircle, CheckCircle2, Lightbulb, Search, HelpCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToastContext } from "@/contexts/ToastContext";
import type {
  RetroActionItemFlag,
  RetroActionItemInput,
} from "@/interfaces/RetroActionItem.interface";

interface RetroActionItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RetroActionItemInput) => Promise<void>;
  initialContent?: string;
  initialFlag?: RetroActionItemFlag | null;
  initialCustomFlag?: string | null;
  initialCardId?: string | null;
  isEdit?: boolean;
  customFlags?: Array<{ id: string; flag_name: string; flag_color: string }>;
  onAddCustomFlag?: (flagName: string) => Promise<void>;
  cards?: Array<{ id: string; content: string; category: string }>;
}

const PREDEFINED_FLAGS: Array<{
  value: RetroActionItemFlag;
  label: string;
  icon: typeof Circle;
  color: string;
}> = [
  { value: "high-priority", label: "Yüksek Öncelik", icon: Circle, color: "#EF4444" },
  { value: "medium-priority", label: "Orta Öncelik", icon: AlertCircle, color: "#F59E0B" },
  { value: "low-priority", label: "Düşük Öncelik", icon: CheckCircle2, color: "#10B981" },
  { value: "improvement", label: "İyileştirme", icon: Lightbulb, color: "#3B82F6" },
  { value: "research", label: "Araştırma", icon: Search, color: "#8B5CF6" },
  { value: "general", label: "Genel", icon: HelpCircle, color: "#6B7280" },
];

const RetroActionItemModal = memo(function RetroActionItemModal({
  open,
  onClose,
  onSubmit,
  initialContent = "",
  initialFlag = null,
  initialCustomFlag = null,
  initialCardId = null,
  isEdit = false,
  customFlags = [],
  onAddCustomFlag,
  cards = [],
}: RetroActionItemModalProps) {
  const { showToast } = useToastContext();
  const [content, setContent] = useState<string>(initialContent);
  const [selectedFlag, setSelectedFlag] = useState<RetroActionItemFlag | null>(
    initialFlag
  );
  const [selectedCustomFlag, setSelectedCustomFlag] = useState<string | null>(
    initialCustomFlag
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    initialCardId
  );
  const [showCustomFlagInput, setShowCustomFlagInput] = useState<boolean>(false);
  const [newCustomFlagName, setNewCustomFlagName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setSelectedFlag(initialFlag);
      setSelectedCustomFlag(initialCustomFlag);
      setSelectedCardId(initialCardId);
      setShowCustomFlagInput(false);
      setNewCustomFlagName("");
    }
  }, [open, initialContent, initialFlag, initialCustomFlag, initialCardId]);

  const handleAddCustomFlag = useCallback(async () => {
    if (!newCustomFlagName.trim()) {
      showToast("Lütfen flag adını girin.", "error");
      return;
    }
    if (!onAddCustomFlag) return;

    try {
      await onAddCustomFlag(newCustomFlagName.trim());
      setNewCustomFlagName("");
      setShowCustomFlagInput(false);
      showToast("Custom flag başarıyla eklendi!", "success");
    } catch (err) {
      showToast("Custom flag eklenirken bir hata oluştu.", "error");
    }
  }, [newCustomFlagName, onAddCustomFlag, showToast]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!content.trim()) {
        showToast("Lütfen aksiyon maddesi içeriğini girin.", "error");
        return;
      }
      setLoading(true);
      try {
        await onSubmit({
          content,
          flag: selectedFlag,
          custom_flag: selectedCustomFlag,
          retro_card_id: selectedCardId,
        });
        setContent("");
        setSelectedFlag(null);
        setSelectedCustomFlag(null);
        onClose();
        showToast(
          isEdit
            ? "Aksiyon maddesi başarıyla güncellendi!"
            : "Aksiyon maddesi başarıyla eklendi!",
          "success"
        );
      } catch (err) {
        showToast("Aksiyon maddesi kaydedilirken bir hata oluştu.", "error");
      } finally {
        setLoading(false);
      }
    },
    [content, selectedFlag, selectedCustomFlag, onSubmit, onClose, isEdit, showToast]
  );

  const handleFlagSelect = useCallback(
    (flag: RetroActionItemFlag) => {
      if (flag === selectedFlag) {
        setSelectedFlag(null);
        setSelectedCustomFlag(null);
      } else {
        setSelectedFlag(flag);
        setSelectedCustomFlag(null);
      }
    },
    [selectedFlag]
  );

  const handleCustomFlagSelect = useCallback(
    (customFlagId: string) => {
      if (customFlagId === selectedCustomFlag) {
        setSelectedCustomFlag(null);
        setSelectedFlag(null);
      } else {
        setSelectedCustomFlag(customFlagId);
        setSelectedFlag("custom");
      }
    },
    [selectedCustomFlag]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Aksiyon Maddesini Düzenle" : "Yeni Aksiyon Maddesi Ekle"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Selection */}
        {cards.length > 0 && (
          <div>
            <label
              htmlFor="action-item-card"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kart Seçimi (Opsiyonel)
            </label>
            <select
              id="action-item-card"
              value={selectedCardId || ""}
              onChange={(e) => setSelectedCardId(e.target.value || null)}
              className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Genel (Kart seçmeden)</option>
              {cards.map((card) => {
                const getCategoryLabel = (category: string) => {
                  if (category === "mad") return "Mad";
                  if (category === "sad") return "Sad";
                  return "Glad";
                };
                const truncatedContent = card.content.length > 50 
                  ? card.content.substring(0, 50) + "..." 
                  : card.content;
                return (
                  <option key={card.id} value={card.id}>
                    {getCategoryLabel(card.category)}: {truncatedContent}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Content Input */}
        <div>
          <label
            htmlFor="action-item-content"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Aksiyon Maddesi
          </label>
          <textarea
            id="action-item-content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Aksiyon maddesini yazın..."
            required
            className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Flag Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Flag / Etiket
          </label>
          
          {/* Predefined Flags */}
          <div className="mb-3 flex flex-wrap gap-2">
            {PREDEFINED_FLAGS.map((flag) => (
              <button
                key={flag.value}
                type="button"
                onClick={() => handleFlagSelect(flag.value)}
                className={`inline-flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-xs font-semibold transition ${
                  selectedFlag === flag.value
                    ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <flag.icon className="h-3.5 w-3.5" />
                {flag.label}
              </button>
            ))}
          </div>

          {/* Custom Flags */}
          {customFlags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {customFlags.map((customFlag) => (
                <button
                  key={customFlag.id}
                  type="button"
                  onClick={() => handleCustomFlagSelect(customFlag.id)}
                  className={`rounded-md border-2 px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCustomFlag === customFlag.id
                      ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  style={{
                    borderColor:
                      selectedCustomFlag === customFlag.id
                        ? undefined
                        : customFlag.flag_color,
                  }}
                >
                  {customFlag.flag_name}
                </button>
              ))}
            </div>
          )}

          {/* Add Custom Flag */}
          {onAddCustomFlag && (
            <div>
              {!showCustomFlagInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomFlagInput(true)}
                  className="rounded-md border-2 border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  + Custom Flag Ekle
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomFlagName}
                    onChange={(e) => setNewCustomFlagName(e.target.value)}
                    placeholder="Flag adı..."
                    className="flex-1 rounded-md border-2 border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomFlag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomFlag}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomFlagInput(false);
                      setNewCustomFlagName("");
                    }}
                    className="rounded-md border-2 border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    İptal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border-2 border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex h-10 items-center justify-center rounded-md border-2 border-indigo-600 bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 hover:border-indigo-700 disabled:opacity-60"
          >
            {loading
              ? isEdit
                ? "Kaydediliyor..."
                : "Ekleniyor..."
              : isEdit
              ? "Kaydet"
              : "Ekle"}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default RetroActionItemModal;


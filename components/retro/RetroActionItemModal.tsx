"use client";

import { memo, useState, useEffect, useCallback } from "react";
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
  isEdit?: boolean;
  customFlags?: Array<{ id: string; flag_name: string; flag_color: string }>;
  onAddCustomFlag?: (flagName: string) => Promise<void>;
}

const PREDEFINED_FLAGS: Array<{
  value: RetroActionItemFlag;
  label: string;
  emoji: string;
  color: string;
}> = [
  { value: "high-priority", label: "Yüksek Öncelik", emoji: "🔴", color: "#EF4444" },
  { value: "medium-priority", label: "Orta Öncelik", emoji: "🟡", color: "#F59E0B" },
  { value: "low-priority", label: "Düşük Öncelik", emoji: "🟢", color: "#10B981" },
  { value: "improvement", label: "İyileştirme", emoji: "🔵", color: "#3B82F6" },
  { value: "research", label: "Araştırma", emoji: "🟣", color: "#8B5CF6" },
  { value: "general", label: "Genel", emoji: "⚪", color: "#6B7280" },
];

const RetroActionItemModal = memo(function RetroActionItemModal({
  open,
  onClose,
  onSubmit,
  initialContent = "",
  initialFlag = null,
  initialCustomFlag = null,
  isEdit = false,
  customFlags = [],
  onAddCustomFlag,
}: RetroActionItemModalProps) {
  const { showToast } = useToastContext();
  const [content, setContent] = useState<string>(initialContent);
  const [selectedFlag, setSelectedFlag] = useState<RetroActionItemFlag | null>(
    initialFlag
  );
  const [selectedCustomFlag, setSelectedCustomFlag] = useState<string | null>(
    initialCustomFlag
  );
  const [showCustomFlagInput, setShowCustomFlagInput] = useState<boolean>(false);
  const [newCustomFlagName, setNewCustomFlagName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setSelectedFlag(initialFlag);
      setSelectedCustomFlag(initialCustomFlag);
      setShowCustomFlagInput(false);
      setNewCustomFlagName("");
    }
  }, [open, initialContent, initialFlag, initialCustomFlag]);

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
      showToast("✅ Custom flag başarıyla eklendi!", "success");
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
        });
        setContent("");
        setSelectedFlag(null);
        setSelectedCustomFlag(null);
        onClose();
        showToast(
          isEdit
            ? "✅ Aksiyon maddesi başarıyla güncellendi!"
            : "✅ Aksiyon maddesi başarıyla eklendi!",
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
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                className={`rounded-md border-2 px-3 py-1.5 text-xs font-semibold transition ${
                  selectedFlag === flag.value
                    ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {flag.emoji} {flag.label}
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
                  className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
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
                    className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
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


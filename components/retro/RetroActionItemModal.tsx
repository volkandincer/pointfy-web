"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { Circle, AlertCircle, CheckCircle2, Lightbulb, Search, HelpCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToastContext } from "@/contexts/ToastContext";
import type {
  RetroActionItemFlag,
  RetroActionItemInput,
} from "@/interfaces/RetroActionItem.interface";
import Button from "@/components/ui/Button";

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
      showToast("Custom flag başarıyla eklendi!", "success");
    } catch {
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
            ? "Aksiyon maddesi başarıyla güncellendi!"
            : "Aksiyon maddesi başarıyla eklendi!",
          "success"
        );
      } catch {
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
        {/* Content Input Card */}
        <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-primary dark:border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md">
          {/* Glow Effect */}
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
          
          {/* Content */}
          <div className="relative z-10">
            <label
              htmlFor="action-item-content"
              className="mb-2 block text-sm font-medium text-card-foreground"
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
              className="w-full rounded-md border-2 border-input bg-background px-3 py-2 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Flag Selection Card */}
        <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-primary dark:border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md">
          {/* Glow Effect */}
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
          
          {/* Content */}
          <div className="relative z-10">
            <label className="mb-2 block text-sm font-medium text-card-foreground">
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
                      ? "border-foreground bg-foreground text-background shadow-sm"
                      : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                        ? "border-foreground bg-foreground text-background shadow-sm"
                        : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                    className="rounded-md border-2 border-dashed border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                      className="flex-1 rounded-md border-2 border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomFlag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddCustomFlag}
                      variant="primary"
                      size="sm"
                    >
                      Ekle
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowCustomFlagInput(false);
                        setNewCustomFlagName("");
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      İptal
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            size="md"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={loading || !content.trim()}
            variant="primary"
            size="md"
            loading={loading}
          >
            {isEdit ? "Kaydet" : "Ekle"}
          </Button>
        </div>
      </form>
    </Modal>
  );
});

export default RetroActionItemModal;


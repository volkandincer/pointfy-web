"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { Angry, Frown, Smile } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToastContext } from "@/contexts/ToastContext";
import type { RetroCategory } from "@/interfaces/Retro.interface";
import Button from "@/components/ui/Button";

interface RetroCardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (category: RetroCategory, content: string) => Promise<void>;
  initialCategory?: RetroCategory;
  initialContent?: string;
  isEdit?: boolean;
}

const getCategoryInfo = (category: RetroCategory) => {
  switch (category) {
    case "mad":
      return { title: "Mad", color: "red", icon: Angry };
    case "sad":
      return { title: "Sad", color: "blue", icon: Frown };
    case "glad":
      return { title: "Glad", color: "green", icon: Smile };
  }
};

const RetroCardModal = memo(function RetroCardModal({
  open,
  onClose,
  onSubmit,
  initialCategory = "glad",
  initialContent = "",
  isEdit = false,
}: RetroCardModalProps) {
  const { showToast } = useToastContext();
  const [category, setCategory] = useState<RetroCategory>(initialCategory);
  const [content, setContent] = useState<string>(initialContent);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setCategory(initialCategory);
      setContent(initialContent);
    }
  }, [open, initialCategory, initialContent]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!content.trim()) {
        showToast("Lütfen kart içeriğini girin.", "error");
        return;
      }
      setLoading(true);
      try {
        await onSubmit(category, content);
        setContent("");
        onClose();
        showToast(
          isEdit ? "Kart başarıyla güncellendi!" : "Kart başarıyla eklendi!",
          "success"
        );
      } catch {
        showToast("Kart kaydedilirken bir hata oluştu.", "error");
      } finally {
        setLoading(false);
      }
    },
    [category, content, onSubmit, onClose, isEdit, showToast]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Kartı Düzenle" : "Yeni Kart Ekle"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector */}
        <div className="flex gap-2">
          {(["mad", "sad", "glad"] as RetroCategory[]).map((cat) => {
            const info = getCategoryInfo(cat);
            const isSelected = category === cat;
            const bgColorClass =
              info.color === "red"
                ? "bg-destructive border-destructive text-destructive-foreground"
                : info.color === "blue"
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-success border-success text-success-foreground";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex items-center justify-center gap-2 flex-1 border-2 px-3 py-2 font-semibold transition-colors ${
                  isSelected
                    ? `${bgColorClass}`
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <info.icon className="h-5 w-5" />
                {info.title}
              </button>
            );
          })}
        </div>

        {/* Content Input */}
        <div>
          <label
            htmlFor="retro-content"
            className="mb-1 block text-sm font-medium text-muted-foreground"
          >
            Kart İçeriği
          </label>
          <textarea
            id="retro-content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Kartınızı yazın..."
            required
            className="w-full rounded-md border-2 border-input bg-input px-3 py-2 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
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

export default RetroCardModal;

"use client";

import { memo, useCallback, useState } from "react";
import { ClipboardList, FileText, CheckSquare, Target, Lightbulb, Rocket, Star, Flame, Pin, Folder, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { BoardInput } from "@/interfaces/Board.interface";

interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: BoardInput) => Promise<void>;
  loading?: boolean;
}

const BOARD_COLORS = [
  { value: "#3B82F6", label: "Mavi" },
  { value: "#10B981", label: "Yeşil" },
  { value: "#F59E0B", label: "Turuncu" },
  { value: "#EF4444", label: "Kırmızı" },
  { value: "#8B5CF6", label: "Mor" },
  { value: "#EC4899", label: "Pembe" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#84CC16", label: "Lime" },
];

const BOARD_ICONS = [
  { icon: ClipboardList, label: "Clipboard" },
  { icon: FileText, label: "File" },
  { icon: CheckSquare, label: "Check" },
  { icon: Target, label: "Target" },
  { icon: Lightbulb, label: "Lightbulb" },
  { icon: Rocket, label: "Rocket" },
  { icon: Star, label: "Star" },
  { icon: Flame, label: "Flame" },
  { icon: Pin, label: "Pin" },
  { icon: Folder, label: "Folder" },
];

const CreateBoardModal = memo(function CreateBoardModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: CreateBoardModalProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>(BOARD_COLORS[0].value);
  const [icon, setIcon] = useState<typeof BOARD_ICONS[0]>(BOARD_ICONS[0]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!name.trim()) return;

      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon: icon.label.toLowerCase(),
      });

      // Form'u temizle
      setName("");
      setDescription("");
      setColor(BOARD_COLORS[0].value);
      setIcon(BOARD_ICONS[0]);
    },
    [name, description, color, icon, onSubmit]
  );

  const handleClose = useCallback(() => {
    if (loading) return;
    setName("");
    setDescription("");
    setColor(BOARD_COLORS[0].value);
    setIcon(BOARD_ICONS[0]);
    onClose();
  }, [loading, onClose]);

  const isFormValid = name.trim().length >= 1;

  return (
    <Modal open={open} title="Yeni Board Oluştur" onClose={handleClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="board-name"
            className="mb-1 block text-sm font-medium text-card-foreground"
          >
            Board Adı
          </label>
          <input
            id="board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: İş Projeleri"
            maxLength={50}
            required
            disabled={loading}
            className="w-full rounded-md border-2 border-input bg-input px-3 py-2 text-card-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {name.length}/50
          </p>
        </div>

        <div>
          <label
            htmlFor="board-desc"
            className="mb-1 block text-sm font-medium text-card-foreground"
          >
            Açıklama (Opsiyonel)
          </label>
          <textarea
            id="board-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Board hakkında kısa bir açıklama..."
            rows={2}
            maxLength={200}
            disabled={loading}
            className="w-full rounded-md border-2 border-input bg-input px-3 py-2 text-card-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {description.length}/200
          </p>
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-card-foreground">
            Renk Seçin
          </label>
          <div className="grid grid-cols-4 gap-3">
            {BOARD_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                disabled={loading}
                className={`group relative h-12 w-full border-2 transition-all ${
                  color === c.value
                    ? "border-foreground shadow-md"
                    : "border-border hover:border-accent hover:shadow-sm"
                }`}
                style={{
                  backgroundColor: c.value,
                  ...(color === c.value && {
                    "--tw-ring-color": c.value,
                  } as React.CSSProperties),
                }}
                title={c.label}
              >
                {color === c.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-6 w-6 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-card-foreground">
            Icon Seçin
          </label>
          <div className="grid grid-cols-5 gap-2">
            {BOARD_ICONS.map((ic) => {
              const IconComponent = ic.icon;
              return (
                <button
                  key={ic.label}
                  type="button"
                  onClick={() => setIcon(ic)}
                  disabled={loading}
                  className={`flex h-12 w-full items-center justify-center border-2 transition-all ${
                    icon === ic
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:bg-accent hover:border-accent hover:shadow-sm"
                  }`}
                >
                  <IconComponent className="h-6 w-6 text-card-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleClose}
            disabled={loading}
            fullWidth
          >
            İptal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!isFormValid || loading}
            loading={loading}
            fullWidth
          >
            {loading ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </div>
      </form>
    </Modal>
  );
});

export default CreateBoardModal;


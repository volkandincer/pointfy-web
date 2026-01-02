"use client";

import { memo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface RoomPinModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  loading?: boolean;
  error?: string | null;
}

const RoomPinModal = memo(function RoomPinModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}: RoomPinModalProps) {
  const [pinInput, setPinInput] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);

  const handleSubmit = () => {
    if (pinInput.length !== 4) {
      return;
    }
    onSubmit(pinInput);
  };

  const handleClose = () => {
    setPinInput("");
    setShowPin(false);
    onClose();
  };

  return (
    <Modal open={open} title="PIN Gerekli" onClose={handleClose}>
      <div className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          Bu oda özel. Katılmak için 4 karakterli PIN girin.
        </p>

        <div className="flex items-center gap-2">
          <input
            type={showPin ? "text" : "password"}
            value={pinInput}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
              if (val.length <= 4) setPinInput(val);
            }}
            maxLength={4}
            placeholder="PIN"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pinInput.length === 4) {
                handleSubmit();
              }
            }}
            className={`flex-1 rounded-md border-2 px-4 py-3 text-center text-lg font-semibold tracking-widest outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 bg-input text-card-foreground ${
              pinInput.length > 0 && pinInput.length !== 4
                ? "border-destructive/50 bg-destructive/10"
                : "border-input"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPin((v) => !v)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-border bg-card transition hover:border-accent hover:bg-accent"
            disabled={loading}
          >
            {showPin ? (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Eye className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {pinInput.length}/4 karakter
        </p>

        {error && (
          <div className="rounded-md border-2 border-red-200 bg-red-50 p-3 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={handleSubmit}
            disabled={pinInput.length !== 4 || loading}
            loading={loading}
          >
            {loading ? "Kontrol ediliyor..." : "Onayla"}
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleClose}
            disabled={loading}
          >
            İptal
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default RoomPinModal;


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
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
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
            className={`flex-1 rounded-md border-2 px-4 py-3 text-center text-base font-semibold tracking-widest outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${
              pinInput.length > 0 && pinInput.length !== 4
                ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                : "border-gray-300 bg-white dark:border-gray-700"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPin((v) => !v)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-gray-300 bg-white transition hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            disabled={loading}
          >
            {showPin ? (
              <EyeOff className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Eye className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
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


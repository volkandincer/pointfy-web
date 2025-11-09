"use client";

import { memo, useState } from "react";
import Modal from "@/components/ui/Modal";

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
            className={`flex-1 rounded-xl border px-4 py-3 text-center text-lg font-semibold tracking-widest outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white ${
              pinInput.length > 0 && pinInput.length !== 4
                ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                : "border-gray-300 bg-white dark:border-gray-700"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPin((v) => !v)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-xl transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            disabled={loading}
          >
            {showPin ? "🙈" : "👁️"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          {pinInput.length}/4 karakter
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={pinInput.length !== 4 || loading}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Kontrol ediliyor..." : "Onayla"}
          </button>
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 bg-transparent px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            İptal
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default RoomPinModal;


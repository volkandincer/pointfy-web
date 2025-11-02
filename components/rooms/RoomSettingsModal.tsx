"use client";

import { memo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { RoomSettings } from "@/interfaces/RoomCreate.interface";

interface RoomSettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: RoomSettings;
  onSave: (settings: RoomSettings) => void;
}

const RoomSettingsModal = memo(function RoomSettingsModal({
  open,
  onClose,
  settings,
  onSave,
}: RoomSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<RoomSettings>(settings);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const updateSetting = <K extends keyof RoomSettings>(
    key: K,
    value: RoomSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Gelişmiş Ayarlar">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Maksimum Katılımcı
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                updateSetting(
                  "maxParticipants",
                  Math.max(2, localSettings.maxParticipants - 1)
                )
              }
              disabled={localSettings.maxParticipants <= 2}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              −
            </button>
            <span className="text-lg font-semibold">
              {localSettings.maxParticipants}
            </span>
            <button
              type="button"
              onClick={() =>
                updateSetting(
                  "maxParticipants",
                  Math.min(20, localSettings.maxParticipants + 1)
                )
              }
              disabled={localSettings.maxParticipants >= 20}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              +
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum: 2, Maksimum: 20
          </p>
        </div>

        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Özel Oda</span>
            <input
              type="checkbox"
              checked={localSettings.isPrivate}
              onChange={(e) => updateSetting("isPrivate", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </div>

        {localSettings.isPrivate && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Oda Şifresi (4 karakter)
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={localSettings.roomPassword}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                  if (val.length <= 4)
                    updateSetting("roomPassword", val);
                }}
                maxLength={4}
                placeholder="4 karakterli şifre"
                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-lg"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {localSettings.roomPassword.length === 4 ? (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Şifre kaydedildi ✓
              </p>
            ) : localSettings.roomPassword.length > 0 ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                4 karakterli şifre gerekli
              </p>
            ) : null}
          </div>
        )}

        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>İzleyicilere İzin Ver</span>
            <input
              type="checkbox"
              checked={localSettings.allowSpectators}
              onChange={(e) =>
                updateSetting("allowSpectators", e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </div>

        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Otomatik Açıklama</span>
            <input
              type="checkbox"
              checked={localSettings.autoReveal}
              onChange={(e) => updateSetting("autoReveal", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default RoomSettingsModal;


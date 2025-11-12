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
      <div className="space-y-6">
        {/* Maksimum Katılımcı */}
        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-lg font-bold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              −
            </button>
            <div className="flex h-16 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {localSettings.maxParticipants}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSetting(
                  "maxParticipants",
                  Math.min(20, localSettings.maxParticipants + 1)
                )
              }
              disabled={localSettings.maxParticipants >= 20}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-lg font-bold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Minimum: 2, Maksimum: 20
          </p>
        </div>

        {/* Özel Oda Toggle */}
        <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Özel Oda
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Odaya şifre ile erişim sağlayın
              </span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={localSettings.isPrivate}
                onChange={(e) => updateSetting("isPrivate", e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 dark:bg-gray-700 peer-checked:dark:bg-blue-600"></div>
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>

        {/* Şifre Input */}
        {localSettings.isPrivate && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-center text-lg font-bold tracking-widest text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded-xl border-2 border-gray-300 bg-white p-3 text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {localSettings.roomPassword.length === 4 ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Şifre kaydedildi
              </p>
            ) : localSettings.roomPassword.length > 0 ? (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                4 karakterli şifre gerekli
              </p>
            ) : null}
          </div>
        )}

        {/* İzleyicilere İzin Ver Toggle */}
        <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                İzleyicilere İzin Ver
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                İzleyiciler oy veremez, sadece görüntüleyebilir
              </span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={localSettings.allowSpectators}
                onChange={(e) =>
                  updateSetting("allowSpectators", e.target.checked)
                }
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 dark:bg-gray-700 peer-checked:dark:bg-blue-600"></div>
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>

        {/* Otomatik Açıklama Toggle */}
        <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Otomatik Açıklama
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Tüm oylar verildiğinde otomatik olarak açıklanır
              </span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={localSettings.autoReveal}
                onChange={(e) => updateSetting("autoReveal", e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 dark:bg-gray-700 peer-checked:dark:bg-blue-600"></div>
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
          >
            Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default RoomSettingsModal;


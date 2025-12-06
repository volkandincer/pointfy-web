"use client";

import { memo, useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
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
              className="inline-flex h-12 w-12 items-center justify-center rounded-md border-2 border-gray-300 bg-white text-lg font-bold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              −
            </button>
            <div className="flex h-16 w-20 items-center justify-center rounded-md border-2 border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20">
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
              className="inline-flex h-12 w-12 items-center justify-center rounded-md border-2 border-gray-300 bg-white text-lg font-bold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Minimum: 2, Maksimum: 20
          </p>
        </div>

        {/* Özel Oda Toggle */}
        <div className="rounded-md border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
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
                className="flex-1 rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-center text-lg font-bold tracking-widest text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded-md border-2 border-gray-300 bg-white p-3 text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {localSettings.roomPassword.length === 4 ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
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
        <div className="rounded-md border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
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
        <div className="rounded-md border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
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
          <Button variant="secondary" size="md" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default RoomSettingsModal;


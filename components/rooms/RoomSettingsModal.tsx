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
          <label className="mb-3 block text-sm font-semibold text-card-foreground">
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
              className="inline-flex h-12 w-12 items-center justify-center rounded-md border-2 border-border bg-card text-lg font-bold text-card-foreground transition-all hover:border-accent hover:bg-accent disabled:opacity-40 disabled:hover:bg-card"
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
              className="inline-flex h-12 w-12 items-center justify-center rounded-md border-2 border-border bg-card text-lg font-bold text-card-foreground transition-all hover:border-accent hover:bg-accent disabled:opacity-40 disabled:hover:bg-card"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Minimum: 2, Maksimum: 20
          </p>
        </div>

        {/* Özel Oda Toggle */}
        <div className="rounded-md border-2 border-border bg-muted p-4 dark:bg-muted/50">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-card-foreground">
                Özel Oda
              </span>
              <span className="text-xs text-muted-foreground">
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
              <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary dark:bg-muted peer-checked:dark:bg-primary"></div>
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>

        {/* Şifre Input */}
        {localSettings.isPrivate && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-card-foreground">
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
                className="flex-1 rounded-md border-2 border-border bg-card px-4 py-3 text-center text-lg font-bold tracking-widest text-card-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded-md border-2 border-border bg-card p-3 text-card-foreground transition-all hover:border-accent hover:bg-accent"
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
        <div className="rounded-md border-2 border-border bg-muted p-4 dark:bg-muted/50">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-card-foreground">
                İzleyicilere İzin Ver
              </span>
              <span className="text-xs text-muted-foreground">
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
              <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary dark:bg-muted peer-checked:dark:bg-primary"></div>
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>

        {/* Otomatik Açıklama Toggle */}
        <div className="rounded-md border-2 border-border bg-muted p-4 dark:bg-muted/50">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="block text-sm font-semibold text-card-foreground">
                Otomatik Açıklama
              </span>
              <span className="text-xs text-muted-foreground">
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
              <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary dark:bg-muted peer-checked:dark:bg-primary"></div>
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


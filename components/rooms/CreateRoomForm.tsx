"use client";

import { memo, useState } from "react";
import RoomSettingsModal from "./RoomSettingsModal";
import type {
  RoomType,
  RoomSettings,
  RoomCreateInput,
} from "@/interfaces/RoomCreate.interface";

interface CreateRoomFormProps {
  onSubmit: (input: RoomCreateInput) => Promise<void>;
  loading?: boolean;
  initialRoomType?: RoomType;
}

const ROOM_TYPES: { key: RoomType; label: string; icon: string; color: string; description: string }[] = [
  { 
    key: "poker", 
    label: "Planning Poker", 
    icon: "🃏",
    color: "blue",
    description: "Task'lar için story point tahmini yapın"
  },
  { 
    key: "retro", 
    label: "Retrospective", 
    icon: "🔄",
    color: "purple",
    description: "Sprint sonrası geri bildirim toplayın"
  },
];

const CreateRoomForm = memo(function CreateRoomForm({
  onSubmit,
  loading = false,
  initialRoomType,
}: CreateRoomFormProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [roomType, setRoomType] = useState<RoomType>(
    initialRoomType || "poker"
  );
  const [settings, setSettings] = useState<RoomSettings>({
    maxParticipants: 10,
    isPrivate: false,
    roomPassword: "",
    allowSpectators: true,
    autoReveal: false,
  });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const isFormValid =
    name.trim().length >= 3 &&
    (!settings.isPrivate || settings.roomPassword.trim().length === 4);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      roomType,
      settings,
    });
  };

  const getRoomTypeColor = (color: string) => {
    const colors: Record<string, { bg: string; selected: string; border: string }> = {
      blue: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        selected: "bg-blue-600 dark:bg-blue-700",
        border: "border-blue-300 dark:border-blue-700",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        selected: "bg-purple-600 dark:bg-purple-700",
        border: "border-purple-300 dark:border-purple-700",
      },
      green: {
        bg: "bg-green-100 dark:bg-green-900/30",
        selected: "bg-green-600 dark:bg-green-700",
        border: "border-green-300 dark:border-green-700",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="room-name"
          className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          Oda Adı
        </label>
        <input
          id="room-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Sprint Planning"
          maxLength={50}
          required
          className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {name.length}/50
        </p>
      </div>

      <div>
        <label
          htmlFor="room-desc"
          className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          Açıklama (Opsiyonel)
        </label>
        <textarea
          id="room-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Oda hakkında kısa bir açıklama..."
          rows={3}
          maxLength={200}
          className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description.length}/200
        </p>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Oda Tipi Seçin
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROOM_TYPES.map((type) => {
            const isSelected = roomType === type.key;
            const colorStyle = getRoomTypeColor(type.color);
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => setRoomType(type.key)}
                className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? `${colorStyle.selected} border-transparent text-white shadow-lg scale-105`
                    : `${colorStyle.bg} ${colorStyle.border} text-gray-700 hover:scale-105 hover:shadow-md dark:text-gray-300`
                }`}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <svg
                      className="h-5 w-5 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                <div className="mb-2 text-3xl">{type.icon}</div>
                <div className="text-sm font-bold">{type.label}</div>
                <div className={`mt-1 text-xs ${isSelected ? "text-white/90" : "text-gray-500 dark:text-gray-400"}`}>
                  {type.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Gelişmiş Ayarlar
        </button>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-60 disabled:hover:shadow-lg"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Oda oluşturuluyor...
          </span>
        ) : (
          "Oda Oluştur"
        )}
      </button>

      <RoomSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          setShowSettingsModal(false);
        }}
      />
    </form>
  );
});

export default CreateRoomForm;

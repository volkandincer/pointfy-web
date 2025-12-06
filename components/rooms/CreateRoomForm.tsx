"use client";

import { memo, useState } from "react";
import { Zap, RotateCcw, Settings, Check, Loader2 } from "lucide-react";
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

const ROOM_TYPES: { key: RoomType; label: string; icon: typeof Zap; color: string; description: string }[] = [
  { 
    key: "poker", 
    label: "Planning Poker", 
    icon: Zap,
    color: "blue",
    description: "Task'lar için story point tahmini yapın"
  },
  { 
    key: "retro", 
    label: "Retrospective", 
    icon: RotateCcw,
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
          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
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
          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
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
                className={`group relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all ${
                  isSelected
                    ? `${colorStyle.selected} border-transparent text-white shadow-sm`
                    : `${colorStyle.bg} ${colorStyle.border} text-gray-700 hover:shadow-md dark:text-gray-300`
                }`}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="mb-2 flex items-center justify-center">
                  <type.icon className="h-8 w-8" />
                </div>
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Settings className="h-5 w-5" />
          Gelişmiş Ayarlar
        </button>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="w-full min-h-[44px] rounded-lg border-2 border-blue-600 bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all active:border-blue-700 active:bg-blue-700 active:shadow-md sm:px-6 sm:py-3.5 hover:border-blue-700 hover:bg-blue-700 hover:shadow-md disabled:opacity-60 disabled:hover:shadow-sm"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
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

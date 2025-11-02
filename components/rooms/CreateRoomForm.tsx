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

const ROOM_TYPES: { key: RoomType; label: string }[] = [
  { key: "poker", label: "Planning Poker" },
  { key: "retro", label: "Retrospective" },
  { key: "refinement", label: "Backlog Refinement" },
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="room-name"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {name.length}/50
        </p>
      </div>

      <div>
        <label
          htmlFor="room-desc"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Açıklama
        </label>
        <textarea
          id="room-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Oda hakkında kısa bir açıklama..."
          rows={3}
          maxLength={200}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description.length}/200
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Oda Tipi
        </p>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => setRoomType(type.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                roomType === type.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          <span>⚙️</span> Gelişmiş Ayarlar
        </button>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="w-full rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
      >
        {loading ? "Oda oluşturuluyor..." : "Oda Oluştur"}
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

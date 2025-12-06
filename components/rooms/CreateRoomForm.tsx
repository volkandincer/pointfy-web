"use client";

import { memo, useState } from "react";
import { Zap, RotateCcw, Settings, Check, Home, FileText, ChevronDown, ChevronUp, Users, Lock, Eye, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
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

const ROOM_TYPES: { key: RoomType; label: string; icon: typeof Zap; color: string; description: string; features: string[] }[] = [
  { 
    key: "poker", 
    label: "Planning Poker", 
    icon: Zap,
    color: "blue",
    description: "Task'lar için story point tahmini yapın",
    features: ["Story point tahmini", "Fibonacci serisi", "Anonim oylama"]
  },
  { 
    key: "retro", 
    label: "Retrospective", 
    icon: RotateCcw,
    color: "purple",
    description: "Sprint sonrası geri bildirim toplayın",
    features: ["Glad/Sad/Mad kategorileri", "Anonim kartlar", "Action items"]
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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

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

  const nameError = name.trim().length > 0 && name.trim().length < 3;
  const passwordError = settings.isPrivate && settings.roomPassword.length > 0 && settings.roomPassword.length !== 4;
  const selectedType = ROOM_TYPES.find(t => t.key === roomType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Oda Tipi Seçimi - Kompakt Tab'lar */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <label className="text-sm font-semibold text-gray-900 dark:text-white">
            Oda Tipi
          </label>
          <span className="text-red-600 dark:text-red-400">*</span>
        </div>
        <div className="border-b-2 border-gray-200 dark:border-gray-700">
          <div className="flex gap-1">
            {ROOM_TYPES.map((type) => {
              const isSelected = roomType === type.key;
              const IconComponent = type.icon;
              const isBlue = type.color === "blue";
              
              return (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setRoomType(type.key)}
                  className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                    isSelected
                      ? isBlue
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : "border-purple-600 text-purple-600 dark:text-purple-400"
                      : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {selectedType && (
          <div className="mt-3 rounded-md border-2 border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {selectedType.description}
            </p>
          </div>
        )}
      </div>

      {/* Form Alanları */}
      <div className="space-y-6">
        {/* Oda Adı */}
        <div>
          <label
            htmlFor="room-name"
            className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
          >
            Oda Adı <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            id="room-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Sprint Planning, Q1 Review, Daily Standup"
            maxLength={50}
            required
            className={`w-full rounded-md border-2 px-4 py-3 text-base text-gray-900 outline-none transition focus:ring-2 ${
              nameError
                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:bg-red-900/20 dark:focus:border-red-500"
                : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400"
            } dark:text-white`}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className={`text-xs ${nameError ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
              {nameError ? "Oda adı en az 3 karakter olmalıdır" : "Minimum 3 karakter gerekli"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {name.length}/50
            </p>
          </div>
        </div>

        {/* Açıklama */}
        <div>
          <label
            htmlFor="room-desc"
            className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
          >
            Açıklama <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(Opsiyonel)</span>
          </label>
          <textarea
            id="room-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bu oda için kısa bir açıklama ekleyin..."
            rows={3}
            maxLength={200}
            className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
          />
          <p className="mt-2 text-right text-xs text-gray-500 dark:text-gray-400">
            {description.length}/200
          </p>
        </div>
      </div>

      {/* Gelişmiş Ayarlar - Accordion */}
      <div className="rounded-md border-2 border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Gelişmiş Ayarlar
            </span>
          </div>
          {showAdvancedSettings ? (
            <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {showAdvancedSettings && (
          <div className="border-t-2 border-gray-200 p-5 space-y-6 dark:border-gray-800">
            {/* Maksimum Katılımcı */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Maksimum Katılımcı
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      maxParticipants: Math.max(2, prev.maxParticipants - 1),
                    }))
                  }
                  disabled={settings.maxParticipants <= 2}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-md border-2 border-gray-300 bg-white text-lg font-bold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  −
                </button>
                <div className="flex h-16 w-20 items-center justify-center rounded-md border-2 border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20">
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {settings.maxParticipants}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      maxParticipants: Math.min(20, prev.maxParticipants + 1),
                    }))
                  }
                  disabled={settings.maxParticipants >= 20}
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
            <div className="rounded-md border-2 border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <label className="flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Özel Oda
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Odaya şifre ile erişim sağlayın
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.isPrivate}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        isPrivate: e.target.checked,
                        roomPassword: e.target.checked ? prev.roomPassword : "",
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 dark:bg-gray-700 peer-checked:dark:bg-blue-600"></div>
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </div>
              </label>
            </div>

            {/* Şifre Input */}
            {settings.isPrivate && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Oda Şifresi (4 karakter) <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={settings.roomPassword}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                      if (val.length <= 4)
                        setSettings((prev) => ({ ...prev, roomPassword: val }));
                    }}
                    maxLength={4}
                    placeholder="1234"
                    className={`flex-1 rounded-md border-2 px-4 py-3 text-center text-lg font-bold tracking-widest text-gray-900 outline-none transition focus:ring-2 ${
                      passwordError
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:bg-red-900/20 dark:focus:border-red-500"
                        : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-blue-400"
                    } dark:text-white`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="rounded-md border-2 border-gray-300 bg-white p-3 text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {settings.roomPassword.length === 4 ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    Şifre kaydedildi
                  </p>
                ) : passwordError ? (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    4 karakterli şifre gerekli
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    4 karakterli şifre girin (harf veya rakam)
                  </p>
                )}
              </div>
            )}

            {/* İzleyicilere İzin Ver Toggle */}
            <div className="rounded-md border-2 border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <label className="flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                      İzleyicilere İzin Ver
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      İzleyiciler oy veremez, sadece görüntüleyebilir
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.allowSpectators}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        allowSpectators: e.target.checked,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 dark:bg-gray-700 peer-checked:dark:bg-blue-600"></div>
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </div>
              </label>
            </div>

            {/* Otomatik Açıklama Toggle */}
            <div className="rounded-md border-2 border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <label className="flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Otomatik Açıklama
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Tüm oylar verildiğinde otomatik olarak açıklanır
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.autoReveal}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        autoReveal: e.target.checked,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 dark:bg-gray-700 peer-checked:dark:bg-blue-600"></div>
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          icon={Home}
          disabled={!isFormValid}
        >
          {loading ? "Oda oluşturuluyor..." : "Oda Oluştur"}
        </Button>
        {!isFormValid && (
          <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
            {name.trim().length < 3 && "Oda adı en az 3 karakter olmalıdır"}
            {name.trim().length >= 3 && settings.isPrivate && settings.roomPassword.length !== 4 && "Özel oda için 4 karakterli şifre gerekli"}
          </p>
        )}
      </div>
    </form>
  );
});

export default CreateRoomForm;

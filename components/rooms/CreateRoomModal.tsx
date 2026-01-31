"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { X, Zap, RotateCcw, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToastContext } from "@/contexts/ToastContext";
import type { RoomType } from "@/interfaces/RoomCreate.interface";
import { getSupabase } from "@/lib/supabase";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomType?: RoomType;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const CreateRoomModal = memo(function CreateRoomModal({
  isOpen,
  onClose,
  initialRoomType,
}: CreateRoomModalProps) {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [userKey, setUserKey] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [selectedType, setSelectedType] = useState<RoomType>(
    initialRoomType || "poker"
  );
  const [roomName, setRoomName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [autoReveal, setAutoReveal] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setRoomName("");
      setDescription("");
      setShowAdvanced(false);
      setIsPrivate(false);
      setRoomPassword("");
      setAutoReveal(false);
      setSelectedType(initialRoomType || "poker");
      return;
    }

    let mounted = true;
    async function fetchUserInfo() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        if (!data.user) {
          showToast("Oda oluşturmak için giriş yapmanız gerekiyor.", "error");
          onClose();
          return;
        }
        setUserKey(data.user.id);
        const { data: userRow } = await supabase
          .from("users")
          .select("username")
          .eq("id", data.user.id)
          .single();
        if (!mounted) return;
        setUsername(
          userRow?.username || data.user.email?.split("@")[0] || "User"
        );
      } catch {
        if (mounted) {
          showToast("Kullanıcı bilgileri alınamadı.", "error");
          onClose();
        }
      }
    }
    fetchUserInfo();
    return () => {
      mounted = false;
    };
  }, [isOpen, onClose, showToast, initialRoomType]);

  const handleCreate = useCallback(async () => {
    if (!userKey || !username) return;

    // Validation
    if (roomName.trim().length < 3) {
      showToast("Oda adı en az 3 karakter olmalıdır.", "error");
      return;
    }
    if (roomName.trim().length > 50) {
      showToast("Oda adı en fazla 50 karakter olabilir.", "error");
      return;
    }
    if (description.trim().length > 200) {
      showToast("Açıklama en fazla 200 karakter olabilir.", "error");
      return;
    }
    if (isPrivate && roomPassword.trim().length !== 4) {
      showToast("Özel oda için 4 karakterli şifre gereklidir.", "error");
      return;
    }
    if (isPrivate && !/^[a-zA-Z0-9]+$/.test(roomPassword)) {
      showToast("Şifre sadece harf ve rakam içerebilir.", "error");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const roomCode = generateRoomCode();

      // Odayı oluştur
      const { data: roomData, error } = await supabase
        .from("rooms")
        .insert({
          code: roomCode,
          name: roomName.trim(),
          description: description.trim() || null,
          room_type: selectedType,
          created_by_key: userKey,
          created_by_username: username,
          is_private: isPrivate,
          room_password: isPrivate ? roomPassword.trim() : null,
          max_participants: 10,
          allow_spectators: true,
          auto_reveal: autoReveal,
          is_active: true,
          status: "active",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;
      if (!roomData) throw new Error("Oda oluşturuldu ama ID alınamadı");

      // Kullanıcıyı odaya admin olarak ekle
      const { error: participantError } = await supabase
        .from("room_participants")
        .insert({
          room_code: roomCode,
          user_key: userKey,
          username: username,
          is_admin: true,
          joined_at: new Date().toISOString(),
        });

      if (participantError) throw participantError;

      // Modal'ı kapat ve odaya yönlendir
      onClose();
      router.push(`/app/rooms/${roomData.id}`);
    } catch (err: unknown) {
      showToast((err as Error).message || "Oda oluşturulamadı.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    userKey,
    username,
    roomName,
    description,
    selectedType,
    isPrivate,
    roomPassword,
    autoReveal,
    router,
    showToast,
    onClose,
  ]);

  if (!isOpen) return null;

  const roomTypes = [
    {
      id: "poker" as RoomType,
      icon: Zap,
      title: "Planning Poker",
      description: "Ekip ile uyum içinde sprint planlayın",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "retro" as RoomType,
      icon: RotateCcw,
      title: "Retrospective",
      description: "Sprint sonrası ekip ile başarıları değerlendirin",
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Yeni Oda Oluştur</h2>
              <p className="text-sm text-slate-400">Takımınız için bir oda oluşturun</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Kapat"
            disabled={loading}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Oda Tipi
            </label>
            <div className="grid grid-cols-2 gap-4">
              {roomTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    disabled={loading}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-600 bg-slate-800/40"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-medium text-white mb-1">{type.title}</h3>
                    <p className="text-xs text-slate-400">{type.description}</p>

                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Oda Adı
            </label>
            <div className="text-xs text-slate-400 mb-2">
              Örn: Sprint Planning, Q1 Review
            </div>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Minimum 3 karakter gerekli"
              disabled={loading}
              maxLength={50}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="mt-1 text-xs text-slate-500 text-right">
              {roomName.length}/50
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu oda için kısa bir açıklama ekleyin..."
              rows={4}
              disabled={loading}
              maxLength={200}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="mt-1 text-xs text-slate-500 text-right">
              {description.length}/200
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={loading}
              className="flex items-center justify-between w-full p-4 bg-slate-800/40 hover:bg-slate-800/60 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center">
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 transition-transform ${
                      showAdvanced ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-white">
                  Gelişmiş Ayarlar
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-slate-800/20 rounded-lg space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300">Otomatik Başlat</label>
                  <button
                    type="button"
                    onClick={() => setAutoReveal(!autoReveal)}
                    disabled={loading}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      autoReveal ? "bg-blue-600" : "bg-slate-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoReveal ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300">Gizli Oda</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPrivate(!isPrivate);
                      if (isPrivate) setRoomPassword("");
                    }}
                    disabled={loading}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isPrivate ? "bg-blue-600" : "bg-slate-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isPrivate ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                {isPrivate && (
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-white mb-2">
                      Oda Şifresi (4 karakter)
                    </label>
                    <input
                      type="text"
                      value={roomPassword}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                        if (value.length <= 4) {
                          setRoomPassword(value);
                        }
                      }}
                      placeholder="4 karakterli şifre"
                      disabled={loading}
                      maxLength={4}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 p-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || roomName.trim().length < 3}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
          >
            {loading ? "Oluşturuluyor..." : "Oda Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CreateRoomModal;

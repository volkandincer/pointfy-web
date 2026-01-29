"use client";

import { memo, useState } from "react";
import { Zap, RotateCcw, Settings, ChevronDown, ChevronUp, Lock, Eye, Sparkles, Plus, Minus } from "lucide-react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import Switch from "@/components/ui/Switch";
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

const ROOM_TYPES: { key: RoomType; label: string; icon: typeof Zap; color: "blue" | "purple"; description: string }[] = [
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

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(3, "Oda adı en az 3 karakter olmalıdır")
    .max(50, "Oda adı en fazla 50 karakter olabilir")
    .required("Oda adı gereklidir"),
  description: Yup.string()
    .trim()
    .max(200, "Açıklama en fazla 200 karakter olabilir"),
  roomPassword: Yup.string()
    .when("isPrivate", {
      is: true,
      then: (schema) => schema
        .trim()
        .length(4, "4 karakterli şifre gerekli")
        .matches(/^[a-zA-Z0-9]+$/, "Sadece harf ve rakam kullanılabilir")
        .required("Özel oda için şifre gereklidir"),
      otherwise: (schema) => schema.notRequired(),
    }),
});

const CreateRoomForm = memo(function CreateRoomForm({
  onSubmit,
  loading = false,
  initialRoomType,
}: CreateRoomFormProps) {
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

  return (
    <Formik
      initialValues={{
        name: "",
        description: "",
        isPrivate: false,
        roomPassword: "",
      }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        await onSubmit({
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          roomType,
          settings: {
            ...settings,
            isPrivate: values.isPrivate,
            roomPassword: values.roomPassword,
          },
        });
      }}
    >
      {({ values, setFieldValue, isSubmitting }) => {
        // Sync isPrivate and roomPassword with settings state
        if (values.isPrivate !== settings.isPrivate) {
          setFieldValue("isPrivate", settings.isPrivate);
        }
        if (values.roomPassword !== settings.roomPassword) {
          setFieldValue("roomPassword", settings.roomPassword);
        }

        return (
          <Form className="space-y-6">
      {/* Room Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">
          Oda Tipi <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-3">
          {ROOM_TYPES.map((type) => {
            const isSelected = roomType === type.key;
            const Icon = type.icon;
            const isBlue = type.color === "blue";
            const borderColor = isSelected
              ? isBlue
                ? "border-blue-600 dark:border-blue-500"
                : "border-purple-600 dark:border-purple-500"
              : "border-border";
            const bgColor = isSelected
              ? isBlue
                ? "bg-blue-50 dark:bg-blue-900/20"
                : "bg-purple-50 dark:bg-purple-900/20"
              : "bg-card";
            const iconBg = isBlue
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "bg-purple-50 dark:bg-purple-900/20";
            const iconText = isBlue
              ? "text-blue-600 dark:text-blue-400"
              : "text-purple-600 dark:text-purple-400";
            
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => setRoomType(type.key)}
                className={`flex flex-1 items-center gap-3 rounded-md border-2 ${borderColor} ${bgColor} p-4 transition-all hover:shadow-sm`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconText}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-foreground">
                    {type.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {type.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

            {/* Basic Information */}
            <div className="space-y-5">
              <Field name="name">
                {({ field, meta }: FieldProps) => (
                  <Input
                    {...field}
                    id="room-name"
                    label="Oda Adı"
                    type="text"
                    placeholder="Örn: Sprint Planning, Q1 Review"
                    maxLength={50}
                    required
                    disabled={loading || isSubmitting}
                    error={meta.touched && meta.error ? meta.error : undefined}
                    helperText={!meta.error ? "Minimum 3 karakter gerekli" : undefined}
                    showCharCount
                  />
                )}
              </Field>

              <Field name="description">
                {({ field, meta }: FieldProps) => (
                  <Textarea
                    {...field}
                    id="room-desc"
                    label="Açıklama"
                    placeholder="Bu oda için kısa bir açıklama ekleyin..."
                    rows={3}
                    maxLength={200}
                    disabled={loading || isSubmitting}
                    error={meta.touched && meta.error ? meta.error : undefined}
                    showCharCount
                  />
                )}
              </Field>
            </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="flex w-full items-center justify-between rounded-md border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Gelişmiş Ayarlar
            </span>
          </div>
          {showAdvancedSettings ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showAdvancedSettings && (
          <div className="space-y-4">
            {/* Max Participants */}
            <div className="rounded-md border border-border bg-card p-4 shadow-sm">
              <label className="mb-3 block text-sm font-semibold text-foreground">
                Maksimum Katılımcı
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      maxParticipants: Math.max(2, prev.maxParticipants - 1),
                    }))
                  }
                  disabled={settings.maxParticipants <= 2}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-all hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex h-9 min-w-[4rem] items-center justify-center rounded-md border border-border bg-muted px-3">
                  <span className="text-sm font-semibold text-foreground">
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
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-all hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="ml-auto text-xs text-muted-foreground">
                  2-20 arası
                </span>
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                <Switch
                  id="is-private"
                  label="Özel Oda"
                  description="Odaya şifre ile erişim sağlayın"
                  icon={<Lock className="h-4 w-4" />}
                  checked={settings.isPrivate}
                  onChange={(e) => {
                    const isPrivate = e.target.checked;
                    setSettings((prev) => ({
                      ...prev,
                      isPrivate,
                      roomPassword: isPrivate ? prev.roomPassword : "",
                    }));
                    setFieldValue("isPrivate", isPrivate);
                    if (!isPrivate) {
                      setFieldValue("roomPassword", "");
                    }
                  }}
                  variant="compact"
                  className="!border-0 !bg-transparent !p-0"
                />
              </div>

              {settings.isPrivate && (
                <Field name="roomPassword">
                  {({ field, meta }: FieldProps) => (
                    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                      <Input
                        {...field}
                        id="room-password"
                        label="Oda Şifresi"
                        type="password"
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                          if (val.length <= 4) {
                            setSettings((prev) => ({ ...prev, roomPassword: val }));
                            setFieldValue("roomPassword", val);
                          }
                        }}
                        maxLength={4}
                        placeholder="1234"
                        required
                        showPasswordToggle
                        disabled={loading || isSubmitting}
                        error={meta.touched && meta.error ? meta.error : undefined}
                        helperText={
                          field.value.length === 4
                            ? undefined
                            : !meta.error
                              ? "4 karakter (harf veya rakam)"
                              : undefined
                        }
                        className="text-center text-base font-semibold tracking-widest"
                      />
                    </div>
                  )}
                </Field>
              )}

              <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                <Switch
                  id="allow-spectators"
                  label="İzleyicilere İzin Ver"
                  description="İzleyiciler oy veremez, sadece görüntüleyebilir"
                  icon={<Eye className="h-4 w-4" />}
                  checked={settings.allowSpectators}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      allowSpectators: e.target.checked,
                    }))
                  }
                  variant="compact"
                  className="!border-0 !bg-transparent !p-0"
                />
              </div>

              <div className="rounded-md border border-border bg-card p-4 shadow-sm">
                <Switch
                  id="auto-reveal"
                  label="Otomatik Açıklama"
                  description="Tüm oylar verildiğinde otomatik olarak açıklanır"
                  icon={<Sparkles className="h-4 w-4" />}
                  checked={settings.autoReveal}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      autoReveal: e.target.checked,
                    }))
                  }
                  variant="compact"
                  className="!border-0 !bg-transparent !p-0"
                />
              </div>
            </div>
          </div>
        )}
      </div>

            {/* Submit Button */}
            <div className="space-y-2 border-t border-border pt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading || isSubmitting}
                disabled={loading || isSubmitting}
              >
                {loading || isSubmitting ? "Oluşturuluyor..." : "Oda Oluştur"}
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
});

export default CreateRoomForm;

"use client";

import { memo, useCallback, useState } from "react";
import { ClipboardList, FileText, CheckSquare, Target, Lightbulb, Rocket, Star, Flame, Pin, Folder, Check, Loader2 } from "lucide-react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";
import Input, { Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import type { BoardInput } from "@/interfaces/Board.interface";

interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: BoardInput) => Promise<void>;
  loading?: boolean;
}

const BOARD_COLORS = [
  { value: "#3B82F6", label: "Mavi" },
  { value: "#10B981", label: "Yeşil" },
  { value: "#F59E0B", label: "Turuncu" },
  { value: "#EF4444", label: "Kırmızı" },
  { value: "#8B5CF6", label: "Mor" },
  { value: "#EC4899", label: "Pembe" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#84CC16", label: "Lime" },
];

const BOARD_ICONS = [
  { icon: ClipboardList, label: "Clipboard" },
  { icon: FileText, label: "File" },
  { icon: CheckSquare, label: "Check" },
  { icon: Target, label: "Target" },
  { icon: Lightbulb, label: "Lightbulb" },
  { icon: Rocket, label: "Rocket" },
  { icon: Star, label: "Star" },
  { icon: Flame, label: "Flame" },
  { icon: Pin, label: "Pin" },
  { icon: Folder, label: "Folder" },
];

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(1, "Board adı gereklidir")
    .max(50, "Board adı en fazla 50 karakter olabilir")
    .required("Board adı gereklidir"),
  description: Yup.string()
    .trim()
    .max(200, "Açıklama en fazla 200 karakter olabilir"),
});

const CreateBoardModal = memo(function CreateBoardModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: CreateBoardModalProps) {
  const [color, setColor] = useState<string>(BOARD_COLORS[0].value);
  const [icon, setIcon] = useState<typeof BOARD_ICONS[0]>(BOARD_ICONS[0]);

  const handleClose = useCallback(() => {
    if (loading) return;
    setColor(BOARD_COLORS[0].value);
    setIcon(BOARD_ICONS[0]);
    onClose();
  }, [loading, onClose]);

  return (
    <Modal open={open} title="Yeni Board Oluştur" onClose={handleClose}>
      <Formik
        initialValues={{ name: "", description: "" }}
        validationSchema={validationSchema}
        onSubmit={async (values, { resetForm }) => {
          await onSubmit({
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            color,
            icon: icon.label.toLowerCase(),
          });
          resetForm();
          setColor(BOARD_COLORS[0].value);
          setIcon(BOARD_ICONS[0]);
        }}
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-6">
            <Field name="name">
              {({ field, meta }: FieldProps) => (
                <div>
                  <Input
                    {...field}
                    id="board-name"
                    type="text"
                    label="Board Adı"
                    placeholder="Örn: İş Projeleri"
                    maxLength={50}
                    required
                    disabled={loading || isSubmitting}
                    error={meta.touched && meta.error ? meta.error : undefined}
                    showCharCount
                  />
                </div>
              )}
            </Field>

            <Field name="description">
              {({ field, meta }: FieldProps) => (
                <div>
                  <Textarea
                    {...field}
                    id="board-desc"
                    label="Açıklama (Opsiyonel)"
                    placeholder="Board hakkında kısa bir açıklama..."
                    rows={2}
                    maxLength={200}
                    disabled={loading || isSubmitting}
                    error={meta.touched && meta.error ? meta.error : undefined}
                    showCharCount
                  />
                </div>
              )}
            </Field>

        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Renk Seçin
          </label>
          <div className="grid grid-cols-4 gap-3">
            {BOARD_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                disabled={loading}
                className={`group relative h-12 w-full border-2 transition-all ${
                  color === c.value
                    ? "border-gray-900 shadow-md"
                    : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
                }`}
                style={{
                  backgroundColor: c.value,
                  ...(color === c.value && {
                    "--tw-ring-color": c.value,
                  } as React.CSSProperties),
                }}
                title={c.label}
              >
                {color === c.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-6 w-6 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Icon Seçin
          </label>
          <div className="grid grid-cols-5 gap-2">
            {BOARD_ICONS.map((ic) => {
              const IconComponent = ic.icon;
              return (
                <button
                  key={ic.label}
                  type="button"
                  onClick={() => setIcon(ic)}
                  disabled={loading}
                  className={`flex h-12 w-full items-center justify-center border-2 transition-all ${
                    icon === ic
                      ? "border-blue-600 bg-blue-50 shadow-sm dark:bg-blue-900/20"
                      : "border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
                >
                  <IconComponent className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-md border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            İptal
          </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1 border-2 border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 hover:border-blue-700 disabled:opacity-60 dark:border-blue-500 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
            >
              {loading || isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </span>
              ) : (
                "Oluştur"
              )}
            </button>
          </div>
        </Form>
        )}
      </Formik>
    </Modal>
  );
});

export default CreateBoardModal;


"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Tag, X } from "lucide-react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";
import Input, { Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Note, NoteInput } from "@/interfaces/Note.interface";

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NoteInput, noteId?: string) => Promise<void>;
  initialNote?: Note;
}

const CATEGORIES = [
  { label: "Kişisel", value: "personal" },
  { label: "İş", value: "work" },
  { label: "Fikir", value: "ideas" },
  { label: "Yapılacaklar", value: "todo" },
  { label: "Önemli", value: "important" },
  { label: "Genel", value: "general" },
  { label: "Özel...", value: "custom" },
] as const;

const validationSchema = Yup.object().shape({
  content: Yup.string()
    .trim()
    .min(1, "Not içeriği gereklidir")
    .max(500, "Not içeriği en fazla 500 karakter olabilir")
    .required("Not içeriği gereklidir"),
  category: Yup.string()
    .required("Kategori gereklidir"),
  customCategory: Yup.string()
    .when("category", {
      is: "custom",
      then: (schema) => schema
        .trim()
        .min(1, "Özel kategori adı gereklidir")
        .max(20, "Özel kategori adı en fazla 20 karakter olabilir")
        .required("Özel kategori adı gereklidir"),
      otherwise: (schema) => schema.notRequired(),
    }),
});

const NoteModal = memo(function NoteModal({
  open,
  onClose,
  onSubmit,
  initialNote,
}: NoteModalProps) {
  const [loading, setLoading] = useState<boolean>(false);

  const categories = useMemo(() => CATEGORIES, []);

  const getInitialCategory = useCallback(() => {
    if (!initialNote?.category) return "general";
    const validCategories = categories.map((c) => c.value);
    if (validCategories.includes(initialNote.category as any)) {
      return initialNote.category;
    }
    return "custom";
  }, [initialNote, categories]);

  const getInitialCustomCategory = useCallback(() => {
    if (!initialNote?.category) return "";
    const validCategories = categories.map((c) => c.value);
    if (validCategories.includes(initialNote.category as any)) {
      return "";
    }
    return initialNote.category;
  }, [initialNote, categories]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
            <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <span className="font-bold">{initialNote ? "Notu Düzenle" : "Hızlı Not Ekle"}</span>
        </div>
      }
      className="sm:border-yellow-600/30 dark:sm:border-yellow-500/30"
    >
      <Formik
        initialValues={{
          content: initialNote?.content || "",
          category: getInitialCategory(),
          customCategory: getInitialCustomCategory(),
        }}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={async (values, { resetForm }) => {
          setLoading(true);
          try {
            const selectedCategory = values.category === "custom" 
              ? values.customCategory.trim() 
              : values.category;
            await onSubmit(
              {
                content: values.content.trim(),
                category: selectedCategory,
              },
              initialNote?.id
            );
            resetForm();
            onClose();
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-4 sm:space-y-6">
            {/* Content Input */}
            <Field name="content">
              {({ field, meta }: FieldProps) => (
                <div>
                  <Textarea
                    {...field}
                    id="note-content"
                    label={
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 sm:h-6 sm:w-6">
                          <FileText className="h-3 w-3 text-yellow-600 dark:text-yellow-400 sm:h-4 sm:w-4" />
                        </div>
                        Not İçeriği <span className="text-red-600 dark:text-red-400">*</span>
                      </div>
                    }
                    placeholder="Notunuzu buraya yazın..."
                    rows={4}
                    maxLength={500}
                    disabled={loading || isSubmitting}
                    autoFocus
                    size="md"
                    error={meta.touched && meta.error ? meta.error : undefined}
                    showCharCount
                    className="focus:border-yellow-500 focus:ring-yellow-500/20 dark:focus:border-yellow-400"
                  />
                </div>
              )}
            </Field>

            {/* Category Selection */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white sm:mb-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 sm:h-6 sm:w-6">
                  <Tag className="h-3 w-3 text-yellow-600 dark:text-yellow-400 sm:h-4 sm:w-4" />
                </div>
                Kategori <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setFieldValue("category", cat.value);
                      if (cat.value !== "custom") {
                        setFieldValue("customCategory", "");
                      }
                    }}
                    disabled={loading || isSubmitting}
                    className={`rounded-md border-2 px-3 py-2.5 text-xs font-semibold transition-all sm:px-3 sm:py-2 sm:text-sm ${
                      values.category === cat.value
                        ? "border-yellow-600 bg-yellow-600 text-white shadow-sm hover:border-yellow-700 hover:bg-yellow-700 dark:border-yellow-500 dark:bg-yellow-600 dark:hover:border-yellow-400 dark:hover:bg-yellow-500"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    } disabled:opacity-50`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {values.category === "custom" && (
                <Field name="customCategory">
                  {({ field, meta }: FieldProps) => (
                    <div className="mt-2 sm:mt-3">
                      <Input
                        {...field}
                        type="text"
                        placeholder="Özel kategori adı..."
                        maxLength={20}
                        disabled={loading || isSubmitting}
                        autoFocus
                        error={meta.touched && meta.error ? meta.error : undefined}
                        className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-yellow-400"
                      />
                      <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                        Özel kategori adınızı yazın (max 20 karakter)
                      </p>
                    </div>
                  )}
                </Field>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 border-t-2 border-gray-200 pt-3 sm:gap-3 sm:pt-4 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={loading || isSubmitting}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading || isSubmitting}
                loading={loading || isSubmitting}
                className="border-yellow-600 bg-yellow-600 hover:border-yellow-700 hover:bg-yellow-700 dark:border-yellow-500 dark:bg-yellow-600 dark:hover:border-yellow-400 dark:hover:bg-yellow-500"
              >
                {loading || isSubmitting ? "Kaydediliyor..." : initialNote ? "Kaydet" : "Kaydet"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
});

export default NoteModal;

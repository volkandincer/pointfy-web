"use client";

import { memo } from "react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";
import Input, { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { PersonalTaskInput } from "@/interfaces/PersonalTask.interface";

interface PersonalTaskFormProps {
  onCreate: (input: PersonalTaskInput) => Promise<void>;
}

const validationSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(1, "Başlık gereklidir")
    .max(200, "Başlık en fazla 200 karakter olabilir")
    .required("Başlık gereklidir"),
  description: Yup.string()
    .trim()
    .max(1000, "Açıklama en fazla 1000 karakter olabilir"),
});

const initialValues = {
  title: "",
  description: "",
};

const PersonalTaskForm = memo(function PersonalTaskForm({
  onCreate,
}: PersonalTaskFormProps) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setSubmitting(true);
        try {
          await onCreate({
            title: values.title.trim(),
            description: values.description.trim() || undefined,
          });
          resetForm();
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-3">
          <Field name="title">
            {({ field, meta }: FieldProps) => (
              <Input
                {...field}
                id="pt-title"
                label="Başlık"
                required
                placeholder="Task başlığı"
                error={meta.touched && meta.error ? meta.error : undefined}
                className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            )}
          </Field>
          <Field name="description">
            {({ field, meta }: FieldProps) => (
              <Textarea
                {...field}
                id="pt-desc"
                label="Açıklama (opsiyonel)"
                rows={3}
                placeholder="Task açıklaması"
                error={meta.touched && meta.error ? meta.error : undefined}
                className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            )}
          </Field>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            loading={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {isSubmitting ? "Ekleniyor..." : "Ekle"}
          </Button>
        </Form>
      )}
    </Formik>
  );
});

export default PersonalTaskForm;

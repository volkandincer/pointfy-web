"use client";

import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type {
  ContactApiResponse,
  ContactFormData,
} from "@/interfaces/Contact.interface";
import { getDefaultNavigationItems } from "@/lib/utils";

// Validation schema matching domain entity rules
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, "Ad en az 2 karakter olmalıdır")
    .max(100, "Ad en fazla 100 karakter olabilir")
    .required("Ad Soyad gereklidir"),
  email: Yup.string()
    .email("Geçerli bir e-posta adresi giriniz")
    .required("E-posta gereklidir"),
  message: Yup.string()
    .trim()
    .min(10, "Mesaj en az 10 karakter olmalıdır")
    .max(2000, "Mesaj en fazla 2000 karakter olabilir")
    .required("Mesaj gereklidir"),
  website: Yup.string(), // Honeypot field
});

const initialValues: ContactFormData = {
  name: "",
  email: "",
  message: "",
  website: "",
};

export default function ContactPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <PageHeader
            title="İletişim"
            description="Sorularınız, önerileriniz veya geri bildirimleriniz için bizimle iletişime geçin."
            icon={Mail}
            iconColor="blue"
            className="mb-8 text-center"
          />

          {/* Form Card */}
          <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-8">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting, resetForm, setStatus }) => {
                setSubmitting(true);
                setStatus(null);
                try {
                  const res = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: values.name.trim(),
                      email: values.email.trim(),
                      message: values.message.trim(),
                      website: values.website || "",
                    }),
                  });
                  const data: ContactApiResponse = await res.json();
                  if (data.success) {
                    setStatus({
                      type: "success",
                      message: "Mesajınız alındı. Teşekkürler!",
                    });
                    resetForm();
                  } else {
                    setStatus({
                      type: "error",
                      message: data.error || "Bir hata oluştu.",
                    });
                  }
                } catch {
                  setStatus({
                    type: "error",
                    message: "Sunucuya ulaşılamıyor.",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, status, setStatus }) => (
                <Form className="space-y-5" noValidate>
                  {/* Honeypot field */}
                  <Field name="website">
                    {({ field }: FieldProps) => (
                      <input
                        {...field}
                        type="text"
                        autoComplete="off"
                        className="hidden"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                    )}
                  </Field>

                  <Field name="name">
                    {({ field, meta }: FieldProps) => (
                      <Input
                        {...field}
                        id="name"
                        type="text"
                        label="Ad Soyad"
                        required
                        placeholder="Adınız ve soyadınız"
                        size="md"
                        error={meta.touched && meta.error ? meta.error : undefined}
                      />
                    )}
                  </Field>

                  <Field name="email">
                    {({ field, meta }: FieldProps) => (
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        label="E-posta"
                        required
                        placeholder="ornek@email.com"
                        size="md"
                        error={meta.touched && meta.error ? meta.error : undefined}
                      />
                    )}
                  </Field>

                  <Field name="message">
                    {({ field, meta }: FieldProps) => (
                      <Textarea
                        {...field}
                        id="message"
                        label="Mesaj"
                        required
                        rows={6}
                        placeholder="Mesajınızı buraya yazın..."
                        size="md"
                        error={meta.touched && meta.error ? meta.error : undefined}
                      />
                    )}
                  </Field>

                  {/* Result Message */}
                  {status && (
                    <div
                      className={`flex items-center gap-2 rounded-md border-2 p-3 ${
                        status.type === "success"
                          ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {status.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 shrink-0" />
                      )}
                      <span className="text-sm font-medium">{status.message}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={isSubmitting}
                      icon={Mail}
                      iconPosition="left"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

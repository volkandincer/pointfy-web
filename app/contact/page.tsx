"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type {
  ContactApiResponse,
  ContactFormData,
} from "@/interfaces/Contact.interface";
import { getDefaultNavigationItems } from "@/lib/utils";


export default function ContactPage() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  const [form, setForm] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: ContactApiResponse = await res.json();
      if (data.success) {
        setResult({
          type: "success",
          message: "Mesajınız alındı. Teşekkürler!",
        });
        setForm({ name: "", email: "", message: "" });
      } else {
        setResult({ type: "error", message: data.error || "Bir hata oluştu." });
      }
    } catch {
      setResult({ type: "error", message: "Sunucuya ulaşılamıyor." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-md border-2 border-primary bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-card-foreground sm:text-4xl">
              İletişim
            </h1>
            <p className="text-sm text-muted-foreground">
              Sorularınız, önerileriniz veya geri bildirimleriniz için bizimle iletişime geçin.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-md border-2 border-border bg-card p-6 shadow-sm sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <input
                type="text"
                name="website"
                autoComplete="off"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />
              
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-card-foreground"
                >
                  Ad Soyad
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-md border-2 border-input bg-input px-4 py-2.5 text-card-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Adınız ve soyadınız"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-card-foreground"
                >
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-md border-2 border-input bg-input px-4 py-2.5 text-card-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-card-foreground"
                >
                  Mesaj
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  className="w-full rounded-md border-2 border-input bg-input px-4 py-2.5 text-card-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Mesajınızı buraya yazın..."
                />
              </div>

              {/* Result Message */}
              {result && (
                <div
                  className={`flex items-center gap-2 rounded-md border-2 p-3 ${
                    result.type === "success"
                      ? "border-green-600/50 bg-green-600/10 text-green-600 dark:text-green-400"
                      : "border-destructive/50 bg-destructive/10 text-destructive"
                  }`}
                >
                  {result.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <span className="text-sm font-medium">{result.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  icon={Mail}
                  iconPosition="left"
                >
                  {loading ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

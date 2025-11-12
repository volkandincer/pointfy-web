"use client";

import { useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { Note } from "@/interfaces/Note.interface";
import NoteList from "@/components/notes/NoteList";
import NoteModal from "@/components/notes/NoteModal";
import { useNotes } from "@/hooks/useNotes";
import { useToastContext } from "@/contexts/ToastContext";

export default function NotesPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const { notes, loading, addNote, removeNote, updateNote } = useNotes();
  const { showToast } = useToastContext();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  // Kategori label mapping
  const CATEGORY_LABELS: Record<string, string> = {
    personal: "Kişisel",
    work: "İş",
    ideas: "Fikir",
    todo: "Yapılacaklar",
    important: "Önemli",
    general: "Genel",
  };

  // Custom kategoriler için label'ı direkt göster
  const getCategoryLabel = (cat: string): string => {
    if (cat === "Tümü") return cat;
    // Eğer constraint'teki kategorilerden biri değilse, direkt kategori adını göster (custom kategori)
    if (CATEGORY_LABELS[cat]) {
      return CATEGORY_LABELS[cat];
    }
    return cat;
  };

  // Mevcut kategorileri çıkar (label'larla birlikte)
  const categories = useMemo(() => {
    const cats = Array.from(new Set(notes.map((n) => n.category)));
    return ["Tümü", ...cats];
  }, [notes]);

  // Filtrelenmiş notlar
  const filteredNotes = useMemo(() => {
    if (selectedCategory === "Tümü") return notes;
    return notes.filter((n) => n.category === selectedCategory);
  }, [notes, selectedCategory]);

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-7xl">
              {/* Header Section */}
              <div className="mb-8">
                <div className="mb-6">
                  <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    Notlarım
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Kişisel notlarını kategorilere ayır, toplantı öncesi hazırlık yap!
                  </p>
                </div>

                {/* Chip Filter Bar */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                          selectedCategory === cat
                            ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {getCategoryLabel(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Note Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setEditingNote(null);
                      setShowModal(true);
                    }}
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-purple-800 hover:shadow-xl"
                  >
                    <svg
                      className="h-5 w-5 transition-transform group-hover:rotate-90"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Yeni Not Ekle
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div>
                {loading ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
                      />
                    ))}
                  </div>
                ) : (
                  <NoteList
                    notes={filteredNotes}
                    onDelete={async (id) => {
                      try {
                        await removeNote(id);
                        showToast("Not başarıyla silindi!", "success");
                      } catch (error: unknown) {
                        showToast(
                          `Not silinemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
                          "error"
                        );
                      }
                    }}
                    onEdit={(n) => {
                      setEditingNote(n);
                      setShowModal(true);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Note Modal */}
        <NoteModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingNote(null);
          }}
          onSubmit={async (input, noteId) => {
            try {
              if (noteId) {
                await updateNote(noteId, input);
                showToast("Not başarıyla güncellendi!", "success");
              } else {
                await addNote(input);
                // Eğer custom kategori "general" olarak kaydedildiyse kullanıcıyı bilgilendir
                const validCategories = ["general", "work", "personal", "ideas", "todo", "important"];
                if (!validCategories.includes(input.category)) {
                  showToast(
                    "Not kaydedildi, ancak özel kategori 'Genel' olarak kaydedildi (veritabanı kısıtlaması).",
                    "info",
                    5000
                  );
                } else {
                  showToast("Not başarıyla kaydedildi!", "success");
                }
              }
              setEditingNote(null);
            } catch (error: unknown) {
              console.error("Error saving note:", error);
              showToast(
                `Not kaydedilemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
                "error"
              );
            }
          }}
          initialNote={editingNote ?? undefined}
        />

        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}

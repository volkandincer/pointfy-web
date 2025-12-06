"use client";

import { useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, selectedCategory]);

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-7xl">
            {/* Header Section */}
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
                      <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                      Notlarım
                    </h1>
                  </div>
                  <p className="ml-13 text-sm text-gray-600 dark:text-gray-400 sm:ml-0">
                    Kişisel notlarınızı kategorilere ayırın ve organize edin
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setEditingNote(null);
                    setShowModal(true);
                  }}
                  icon={Plus}
                >
                  Yeni Not
                </Button>
              </div>

              {/* Category Filter - Minimal Tabs */}
              {categories.length > 1 && (
                <div className="mb-6 border-b-2 border-gray-200 dark:border-gray-700">
                  <div className="flex gap-1 overflow-x-auto">
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                            isActive
                              ? "border-yellow-600 text-yellow-600 dark:text-yellow-400"
                              : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                          }`}
                        >
                          {getCategoryLabel(cat)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notes List */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-48 animate-pulse border-l-4 border-l-yellow-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-yellow-500 dark:border-gray-700 dark:bg-gray-900"
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
                  onCreateNew={() => {
                    setEditingNote(null);
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
  );
}

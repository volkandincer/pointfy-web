"use client";

import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
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
  const filteredNotes = selectedCategory === "Tümü" 
    ? notes 
    : notes.filter((n) => n.category === selectedCategory);

  return (
    <>
      <Header navigationItems={navigationItems} />
        <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-7xl">
              {/* Header Section */}
              <div className="mb-8">
                <SectionHeader
                  title="Notlarım"
                  description="Kişisel notlarınızı kategorilere ayırın ve organize edin"
                />

              {/* Category Filter - Pill Style Tabs */}
              {categories.length > 1 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat;
                      return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                          className={`whitespace-nowrap rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                            isActive
                              ? "border-primary bg-primary text-primary-foreground shadow-sm hover:border-primary hover:bg-primary/90"
                              : "border-border bg-card text-muted-foreground hover:border-border hover:bg-accent hover:text-accent-foreground"
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

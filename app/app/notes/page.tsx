"use client";

import { useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
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
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="mb-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <PageHeader
                title="Notlarım"
                description="Kişisel notlarınızı kategorilere ayırın ve organize edin"
                icon={FileText}
                iconColor="yellow"
              />
              <Button
                onClick={() => {
                  setEditingNote(null);
                  setShowModal(true);
                }}
                variant="primary"
                size="sm"
                icon={Plus}
                className="!border-yellow-600 !bg-yellow-600 hover:!border-yellow-700 hover:!bg-yellow-700 dark:!border-yellow-500 dark:!bg-yellow-600 dark:hover:!border-yellow-400 dark:hover:!bg-yellow-500"
              >
                Yeni Not
              </Button>
            </div>

            {/* Category Filter - Badge Style */}
            {categories.length > 1 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
                        isActive
                          ? "border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-500"
                          : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900"
                      }`}
                    >
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {getCategoryLabel(cat)}
                      </span>
                    </button>
                  );
                })}
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
                    className="h-40 animate-pulse rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
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

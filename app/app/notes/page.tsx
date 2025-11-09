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

export default function NotesPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const { notes, loading, addNote, removeNote, updateNote } = useNotes();
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
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 py-8">
            <div className="mx-auto max-w-4xl">
              {/* Header */}
              <div className="mb-6 text-center">
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Notlarım
                </h1>
                <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                  Kişisel notlarını kategorilere ayır, toplantı öncesi hazırlık
                  yap!
                </p>
              </div>

              {/* Chip Filter Bar */}
              <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-800">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {cat === "Tümü" ? cat : CATEGORY_LABELS[cat] || cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Note Button */}
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => {
                    setEditingNote(null);
                    setShowModal(true);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  + Yeni Not Ekle
                </button>
              </div>

              {/* Notes List */}
              <div>
                {loading ? (
                  <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ) : (
                  <NoteList
                    notes={filteredNotes}
                    onDelete={removeNote}
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
              } else {
                await addNote(input);
              }
              setEditingNote(null);
            } catch (error: any) {
              console.error("Error saving note:", error);
              console.error("Error details:", JSON.stringify(error, null, 2));
              console.error("Error message:", error?.message);
              console.error("Error code:", error?.code);
              console.error("Error details:", error?.details);
              console.error("Error hint:", error?.hint);
              alert(
                `Not kaydedilemedi: ${error?.message || "Bilinmeyen hata"}`
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

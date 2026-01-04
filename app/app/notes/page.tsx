"use client";

import { useMemo, useState } from "react";
import { FileText, Briefcase, Heart, Lightbulb, CheckSquare, AlertCircle, Folder } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/ui/SectionHeader";
import StatsCard from "@/components/ui/StatsCard";
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

  // Kategori bazlı stats
  const categoryStats = useMemo(() => {
    return {
      total: notes.length,
      personal: notes.filter((n) => n.category === "personal").length,
      work: notes.filter((n) => n.category === "work").length,
      ideas: notes.filter((n) => n.category === "ideas").length,
      todo: notes.filter((n) => n.category === "todo").length,
      important: notes.filter((n) => n.category === "important").length,
      general: notes.filter((n) => n.category === "general").length,
    };
  }, [notes]);

  // Kategori icon mapping
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, typeof FileText> = {
      personal: Heart,
      work: Briefcase,
      ideas: Lightbulb,
      todo: CheckSquare,
      important: AlertCircle,
      general: Folder,
    };
    return iconMap[category] || FileText;
  };

  // Kategori color mapping
  const getCategoryColor = (category: string): "pink" | "blue" | "purple" | "yellow" | "red" | "primary" => {
    const colorMap: Record<string, "pink" | "blue" | "purple" | "yellow" | "red" | "primary"> = {
      personal: "pink",
      work: "blue",
      ideas: "purple",
      todo: "yellow",
      important: "red",
      general: "primary",
    };
    return colorMap[category] || "primary";
  };

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

                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <StatsCard
                    icon={FileText}
                    value={categoryStats.total}
                    label="Toplam Not"
                    color="primary"
                  />
                  {categoryStats.personal > 0 && (
                    <StatsCard
                      icon={getCategoryIcon("personal")}
                      value={categoryStats.personal}
                      label="Kişisel"
                      color={getCategoryColor("personal")}
                      onClick={() => setSelectedCategory(selectedCategory === "personal" ? "Tümü" : "personal")}
                      className={selectedCategory === "personal" ? "ring-2 ring-pink-500" : ""}
                    />
                  )}
                  {categoryStats.work > 0 && (
                    <StatsCard
                      icon={getCategoryIcon("work")}
                      value={categoryStats.work}
                      label="İş"
                      color={getCategoryColor("work")}
                      onClick={() => setSelectedCategory(selectedCategory === "work" ? "Tümü" : "work")}
                      className={selectedCategory === "work" ? "ring-2 ring-blue-500" : ""}
                    />
                  )}
                  {categoryStats.ideas > 0 && (
                    <StatsCard
                      icon={getCategoryIcon("ideas")}
                      value={categoryStats.ideas}
                      label="Fikir"
                      color={getCategoryColor("ideas")}
                      onClick={() => setSelectedCategory(selectedCategory === "ideas" ? "Tümü" : "ideas")}
                      className={selectedCategory === "ideas" ? "ring-2 ring-purple-500" : ""}
                    />
                  )}
                  {categoryStats.todo > 0 && (
                    <StatsCard
                      icon={getCategoryIcon("todo")}
                      value={categoryStats.todo}
                      label="Yapılacaklar"
                      color={getCategoryColor("todo")}
                      onClick={() => setSelectedCategory(selectedCategory === "todo" ? "Tümü" : "todo")}
                      className={selectedCategory === "todo" ? "ring-2 ring-yellow-500" : ""}
                    />
                  )}
                  {categoryStats.important > 0 && (
                    <StatsCard
                      icon={getCategoryIcon("important")}
                      value={categoryStats.important}
                      label="Önemli"
                      color={getCategoryColor("important")}
                      onClick={() => setSelectedCategory(selectedCategory === "important" ? "Tümü" : "important")}
                      className={selectedCategory === "important" ? "ring-2 ring-red-500" : ""}
                    />
                  )}
                  {categoryStats.general > 0 && (
                    <StatsCard
                      icon={getCategoryIcon("general")}
                      value={categoryStats.general}
                      label="Genel"
                      color={getCategoryColor("general")}
                      onClick={() => setSelectedCategory(selectedCategory === "general" ? "Tümü" : "general")}
                      className={selectedCategory === "general" ? "ring-2 ring-primary" : ""}
                    />
                  )}
                </div>

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

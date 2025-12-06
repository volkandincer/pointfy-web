"use client";

import { memo, useState } from "react";
import { FileText, Plus } from "lucide-react";
import NoteModal from "./NoteModal";
import { useNotes } from "@/hooks/useNotes";
import { useToastContext } from "@/contexts/ToastContext";

const GlobalNoteFab = memo(function GlobalNoteFab() {
  const { addNote } = useNotes();
  const { showToast } = useToastContext();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group animate-float fixed bottom-20 right-4 z-[60] flex min-h-[64px] min-w-[64px] items-center justify-center rounded-md border-2 border-yellow-600 bg-yellow-600 text-white shadow-sm transition-all duration-300 ease-out sm:bottom-8 sm:right-8 sm:min-h-[72px] sm:min-w-[72px] hover:border-yellow-700 hover:bg-yellow-700 hover:shadow-md hover:scale-110 active:scale-105 dark:border-yellow-500 dark:bg-yellow-600 dark:hover:border-yellow-400 dark:hover:bg-yellow-500"
        aria-label="Not ekle"
      >
        {/* Pulse ring effect */}
        <div
          className={`absolute inset-0 rounded-md border-2 border-yellow-600 transition-all duration-300 ${
            isHovered ? "animate-ping opacity-20" : "opacity-0"
          }`}
        />
        
        {/* Icon container with scale animation */}
        <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          {isHovered ? (
            <Plus className="h-6 w-6 transition-all duration-300 sm:h-7 sm:w-7" />
          ) : (
            <FileText className="h-6 w-6 transition-all duration-300 sm:h-7 sm:w-7" />
          )}
        </div>

        {/* Text label - appears on hover */}
        <span
          className={`absolute right-full mr-3 whitespace-nowrap rounded-md border-2 border-yellow-600 bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 ${
            isHovered
              ? "translate-x-0 opacity-100"
              : "translate-x-2 opacity-0 pointer-events-none"
          } dark:border-yellow-500 dark:bg-yellow-600`}
        >
          Not Ekle
        </span>
      </button>

      <NoteModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={async (input) => {
          try {
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
            setShowModal(false);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
            showToast(
              `Not kaydedilemedi: ${errorMessage}`,
              "error"
            );
          }
        }}
      />
    </>
  );
});

export default GlobalNoteFab;

